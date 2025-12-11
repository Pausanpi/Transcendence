import fastifyStatic from '@fastify/static';
import createFastifyApp from '../shared/fastify-config.js';
import dotenv from 'dotenv';
import fastifyHttpProxy from '@fastify/http-proxy';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const SERVICE_TOKEN = process.env.SERVICE_TOKEN || 'dev-service-token';

async function startGateway() {
    const fastify = await createFastifyApp({
        serviceName: 'api-gateway',
        enableSessions: true,
        corsOrigin: true
    });

    console.log('🚀 Iniciando API Gateway...');
    
    fastify.addHook('onRequest', async (request, reply) => {
        if (process.env.NODE_ENV === 'production') {
            reply.header('X-Forwarded-Proto', 'https');
        }
    });

    // Rutas estáticas y autenticación
    fastify.get('/', async (request, reply) => {
        if (request.isAuthenticated?.()) {
            return reply.redirect('/auth/profile');
        }
        return reply.sendFile('auth/login.html');
    });

    fastify.get('/auth/login', async (request, reply) => {
        return reply.sendFile('auth/login.html');
    });

    fastify.get('/auth/profile', async (request, reply) => {
        if (!request.isAuthenticated?.()) {
            return reply.redirect('/auth/login');
        }
        return reply.sendFile('auth/profile.html');
    });

    fastify.get('/auth/2fa-required', async (request, reply) => {
        return reply.sendFile('auth/2fa-required.html');
    });

    fastify.get('/2fa/management', async (request, reply) => {
        if (!request.isAuthenticated?.()) {
            return reply.redirect('/auth/login');
        }
        return reply.sendFile('auth/2fa-management.html');
    });

    fastify.get('/gdpr/management', async (request, reply) => {
        if (!request.isAuthenticated?.()) {
            return reply.redirect('/auth/login');
        }
        return reply.sendFile('auth/gdpr.html');
    });

    fastify.get('/users/users.html', async (request, reply) => {
        if (!request.isAuthenticated?.()) {
            return reply.redirect('/auth/login');
        }
        return reply.sendFile('users/users.html');
    });

    fastify.get('/users/decode.html', async (request, reply) => {
        return reply.sendFile('users/decode.html');
    });

    // Proxy /auth
    await fastify.register(fastifyHttpProxy, {
        upstream: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
        prefix: '/auth',
        rewritePrefix: '/auth',
        http2: false,
        websocket: false,
        disableCache: true,
        replyOptions: {
            rewriteRequestHeaders: (req, headers) => ({
                ...headers,
                'x-service-token': SERVICE_TOKEN,
                'x-forwarded-proto': 'https',
                'cookie': req.headers.cookie || ''
            }),
            onResponse: async (request, reply, res) => {
                const setCookie = res.headers['set-cookie'];
                if (setCookie) {
                    if (Array.isArray(setCookie)) {
                        setCookie.forEach(cookie => reply.raw.setHeader('Set-Cookie', cookie));
                    } else {
                        reply.raw.setHeader('Set-Cookie', setCookie);
                    }
                }
            }
        }
    });

    // Proxy /2fa
    await fastify.register(fastifyHttpProxy, {
        upstream: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
        prefix: '/2fa',
        rewritePrefix: '/2fa',
        http2: false,
        replyOptions: {
            rewriteRequestHeaders: (req, headers) => ({
                ...headers,
                'x-service-token': SERVICE_TOKEN,
                'x-forwarded-proto': 'https',
                'cookie': req.headers.cookie || ''
            }),
            onResponse: async (request, reply, res) => {
                const setCookie = res.headers['set-cookie'];
                if (setCookie) {
                    if (Array.isArray(setCookie)) {
                        setCookie.forEach(cookie => reply.raw.setHeader('Set-Cookie', cookie));
                    } else {
                        reply.raw.setHeader('Set-Cookie', setCookie);
                    }
                }
            }
        }
    });

    // Proxy otros servicios
    await fastify.register(fastifyHttpProxy, {
        upstream: process.env.I18N_SERVICE_URL || 'http://localhost:3002',
        prefix: '/i18n',
        rewritePrefix: '/i18n',
        http2: false
    });

    await fastify.register(fastifyHttpProxy, {
        upstream: process.env.DATABASE_SERVICE_URL || 'http://localhost:3003',
        prefix: '/database',
        rewritePrefix: '/',
        http2: false
    });

    await fastify.register(fastifyHttpProxy, {
        upstream: process.env.USERS_SERVICE_URL || 'http://localhost:3004',
        prefix: '/users',
        rewritePrefix: '/users',
        http2: false
    });

    // Archivos estáticos
    await fastify.register(fastifyStatic, {
        root: path.join(__dirname, '../frontend'),
        prefix: '/',
        wildcard: true,
        index: false
    });

    const port = process.env.GATEWAY_PORT || 3000;
    await fastify.listen({
        port,
        host: '0.0.0.0'
    });
    
    console.log(`🚀 API Gateway ejecutándose en puerto ${port}`);
}

startGateway().catch(error => {
    console.error('Failed to start API Gateway:', error);
    process.exit(1);
});
