import Fastify from 'fastify';
import authRoutes from './routes/auth.js';
import twoFARoutes from './routes/2fa.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fastifyStatic from '@fastify/static';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function startAuthService() {
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
        } catch {
            console.log('pino-pretty not available, using default logger');
        }
    }
    
    const fastify = Fastify({
        logger: loggerConfig,
        trustProxy: true
    });

    // CORS
    const fastifyCors = await import('@fastify/cors');
    await fastify.register(fastifyCors.default, {
        origin: process.env.CORS_ORIGIN || true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'x-service-token', 'Cookie'],
        exposedHeaders: ['Set-Cookie']
    });

    // formbody
    const fastifyFormbody = await import('@fastify/formbody');
    await fastify.register(fastifyFormbody.default);

    // secure-session
    const fastifySecureSession = await import('@fastify/secure-session');
    const sessionSecret = process.env.SESSION_SECRET;
    let sessionKey;
    if (sessionSecret && sessionSecret.length >= 64) {
        sessionKey = Buffer.from(sessionSecret, 'hex');
    } else {
        console.warn('SESSION_SECRET not set or invalid, generating random session key');
        sessionKey = crypto.randomBytes(32);
        console.log('Generated session key (hex):', sessionKey.toString('hex'));
    }

    await fastify.register(fastifySecureSession.default, {
        key: sessionKey,
        cookie: {
            path: '/',
            secure: false, // obligatorio con SameSite=None
            httpOnly: true,
            sameSite: 'lax',
        },
        cookieName: 'sessionId',
        sessionName: 'session'
    });

    // Passport
    const fastifyPassport = await import('@fastify/passport');
    const { configurePassport } = await import('./config/oauth.js');

    await fastify.register(fastifyPassport.default.initialize());
    await fastify.register(fastifyPassport.default.secureSession());

    // Configurar estrategias y serializadores
    configurePassport(fastifyPassport.default);

    // onSend log cookies
    fastify.addHook('onSend', async (request, reply, payload) => {
        const cookies = reply.getHeader('Set-Cookie');
        if (cookies) console.log('🍪 Set-Cookie headers:', cookies);
    });

    // Decoradores logIn / isAuthenticated
    fastify.addHook('onReady', async () => {
        if (!fastify.hasRequestDecorator('logIn')) {
            fastify.decorateRequest('logIn', function(user) {
                console.log('🔐 logIn called for user:', user.id);

                // Guardar datos usando session.set()
                this.session.set('userId', user.id);
                this.session.set('user', {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    avatar: user.avatar || 'default-avatar.png'
                });
                this.session.set('twoFactorVerified', false);

                console.log('✅ Session data set for user:', user.id);
                console.log('🔍 Session keys after logIn:', Array.from(this.session.keys()));
                return Promise.resolve();
            });
        }

        if (!fastify.hasRequestDecorator('isAuthenticated')) {
            fastify.decorateRequest('isAuthenticated', function() {
                const hasUserId = !!this.session.get('userId');
                console.log('🔍 isAuthenticated check - userId:', this.session.get('userId'));
                return hasUserId;
            });
        }
    });

    // Error handler
    fastify.setErrorHandler(function (error, request, reply) {
        fastify.log.error({ err: error, url: request.url, method: request.method }, 'Request error');
        const statusCode = error.statusCode || 500;
        const response = { error: 'common.internalError', code: 'INTERNAL_ERROR' };
        if (error.validation) {
            reply.status(400);
            response.error = 'validation.invalidInput';
            response.code = 'VALIDATION_ERROR';
            response.details = error.validation;
        }
        if (process.env.NODE_ENV === 'development') response.message = error.message;
        reply.status(statusCode).send(response);
    });

    fastify.setNotFoundHandler((request, reply) => {
        reply.status(404).send({ error: 'Route not found', path: request.url, code: 'ROUTE_NOT_FOUND' });
    });

    // Archivos estáticos
    await fastify.register(fastifyStatic, {
        root: path.join(__dirname, '../frontend'),
        prefix: '/',
    });

    // Rutas
    await fastify.register(authRoutes, { prefix: '/auth' });
    await fastify.register(twoFARoutes, { prefix: '/2fa' });

    // Salud
    fastify.get('/health', async () => ({
        service: 'auth-service',
        status: 'OK',
        url: process.env.AUTH_SERVICE_PORT,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: ['/auth', '/2fa']
    }));

    fastify.get('/ready', async () => {
        try {
            const db = (await import('../database/config/sqlite.js')).default;
            await db.get('SELECT 1 as test');
            return { status: 'ready', database: 'connected' };
        } catch (error) {
            return { status: 'not-ready', database: 'error', error: error.message };
        }
    });

    const port = process.env.AUTH_SERVICE_PORT || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });

    console.log(`✅ Auth Service running on port ${port}`);
    console.log('✅ Secure sessions and Passport initialized');
}

startAuthService().catch(error => {
    console.error('Failed to start Auth Service:', error);
    process.exit(1);
});
