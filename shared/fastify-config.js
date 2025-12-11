import Fastify from 'fastify';
import crypto from 'crypto';

export default async function createFastifyApp(options = {}) {
    const { serviceName = 'unknown', enableSessions = false, corsOrigin = false } = options;
    
    const loggerConfig = {
        level: process.env.LOG_LEVEL || 'info'
    };
    
    if (process.env.NODE_ENV === 'development') {
        try {
            await import('pino-pretty');
            loggerConfig.transport = {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname'
                }
            };
        } catch (error) {
            console.log('pino-pretty not available, using default logger');
        }
    }
    
    const fastify = Fastify({
        logger: loggerConfig,
        trustProxy: true
    });
    
    if (corsOrigin) {
        const fastifyCors = await import('@fastify/cors');
        await fastify.register(fastifyCors.default, {
            origin: corsOrigin === true ? true : corsOrigin,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'x-service-token', 'Cookie'],
            exposedHeaders: ['Set-Cookie']
        });
    }
    
    if (serviceName === 'api-gateway' || serviceName === 'auth-service') {
        const fastifyFormbody = await import('@fastify/formbody');
        await fastify.register(fastifyFormbody.default);
    }
    
    // IMPORTANTE: Solo registrar @fastify/cookie si NO es auth-service
    // porque fastifyPassport.default.secureSession() lo registrará automáticamente
    if (serviceName === 'api-gateway') {
        const fastifyCookie = await import('@fastify/cookie');
        await fastify.register(fastifyCookie.default, {
            secret: process.env.COOKIE_SECRET || 'cookie-secret-' + crypto.randomBytes(16).toString('hex'),
            hook: 'onRequest'
        });
    }
    
    if (enableSessions) {
        const fastifySecureSession = await import('@fastify/secure-session');
        
        const sessionSecret = process.env.SESSION_SECRET;
        let sessionKey;
        if (sessionSecret && sessionSecret.length >= 64) {
            sessionKey = Buffer.from(sessionSecret, 'hex');
        } else {
            console.warn('SESSION_SECRET not set or invalid, generating random session key');
            sessionKey = crypto.randomBytes(32);
            console.log('Generated session key (hex):', sessionKey.toString('hex'));
            console.log('Set this as SESSION_SECRET environment variable for consistent sessions');
        }
        
        await fastify.register(fastifySecureSession.default, {
            key: sessionKey,
            cookie: {
                path: '/',
                secure: 'false',
                httpOnly: true,
                sameSite: 'lax'
               
            },
            cookieName: 'sessionId',
            sessionName: 'session'

        });
        
        // IMPORTANTE: Para auth-service, NO registrar Passport aquí
        // Lo haremos manualmente en el archivo principal del auth-service
        if (serviceName === 'api-gateway') {
            const fastifyPassport = await import('@fastify/passport');
            await fastify.register(fastifyPassport.default.initialize());
            await fastify.register(fastifyPassport.default.secureSession());
            console.log(`✅ Secure sessions initialized for ${serviceName}`);
        }
    }
    
    fastify.addHook('onReady', async () => {
        if (!fastify.hasRequestDecorator('isAuthenticated')) {
            fastify.decorateRequest('isAuthenticated', function() {
                return !!this.session?.userId ||
                       !!this.session?.passport?.user ||
                       !!this.user;
            });
        }
    });
    
    if (serviceName === 'api-gateway') {
        fastify.addHook('onRequest', async (request, reply) => {
            const startTime = Date.now();
            fastify.log.info({
                method: request.method,
                url: request.url,
                ip: request.ip,
                userAgent: request.headers['user-agent']
            }, 'Incoming request');
            reply.header('X-Request-ID', request.id);
            request.startTime = startTime;
        });
        
        fastify.addHook('onSend', async (request, reply, payload) => {
            if (request.startTime) {
                const responseTime = Date.now() - request.startTime;
                fastify.log.info({
                    statusCode: reply.statusCode,
                    responseTime: `${responseTime}ms`
                }, 'Request completed');
            }
        });
    }
    
    fastify.setErrorHandler(function (error, request, reply) {
        fastify.log.error({
            err: error,
            url: request.url,
            method: request.method
        }, 'Request error');
        const statusCode = error.statusCode || 500;
        const response = {
            error: 'common.internalError',
            code: 'INTERNAL_ERROR'
        };
        if (error.validation) {
            reply.status(400);
            response.error = 'validation.invalidInput';
            response.code = 'VALIDATION_ERROR';
            response.details = error.validation;
        }
        if (process.env.NODE_ENV === 'development') {
            response.message = error.message;
        }
        reply.status(statusCode).send(response);
    });
    
    fastify.setNotFoundHandler(function (request, reply) {
        reply.status(404).send({
            error: 'Route not found',
            path: request.url,
            code: 'ROUTE_NOT_FOUND'
        });
    });
    
    return fastify;
}