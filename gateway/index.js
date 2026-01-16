import fastifyStatic from '@fastify/static';
import createFastifyApp from '../shared/fastify-config.js';

import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import gdprRoutes from './routes/gdpr.js';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)



import jwtService from '../auth/services/jwt.js';
import {
	findOrCreateOAuthUser
} from '../users/models/User.js';

import fastifyPassport from '@fastify/passport';
import { configurePassport } from '../auth/config/oauth.js';




const SERVICE_TOKEN = process.env.SERVICE_TOKEN || 'dev-service-token';
const jwtSecret = process.env.JWT_SECRET || 'dev-fallback-secret-' +
    (process.env.JWT_SECRET_SUFFIX || 'default-suffix');

async function startGateway() {



	const fastify = await createFastifyApp({
		serviceName: 'api-gateway',
		enableSessions: false,
		corsOrigin: true
	});

/*
configurePassport(fastifyPassport);
fastify.register(fastifyPassport.initialize());
*/


await fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../frontend/dist'),
  prefix: '/dist/',
  decorateReply: false
})



fastify.addHook('onRequest', async (request, reply) => {
   if (!request.url.startsWith('/api/')) return;
   // if (request.url.startsWith('/api/i18n/')) return;

    const publicRoutes = [
        '/api/auth/login',
        '/api/auth/register',
        '/api/2fa/verify-login',
		'/api/auth/github',
        '/api/auth/health',
		'/api/health',
		'/api/i18n/',
        '/api/database/health',
        '/api/users/health'
    ];

    if (publicRoutes.some(route => request.url.startsWith(route))) {
        return;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({
            success: false,
            error: 'auth.authenticationRequired'
        });
    }

    const token = authHeader.substring(7).trim();
    try {
        request.user = jwt.verify(token, jwtSecret, {
            issuer: 'auth-service',
            audience: 'user'
        });
    } catch (err) {
        fastify.log.error('JWT verification failed:', err.message);
        return reply.status(401).send({
            success: false,
            error: 'auth.invalidToken'
        });
    }
});


async function proxyAPI(request, reply, upstreamBase, keepPrefix = false) {
    try {
        let url = request.url;
        if (keepPrefix) {
            url = url.replace(/^\/api/, '');
        } else {
            url = url.replace(/^\/api\/[^/]+/, '');
        }
        const target = `${upstreamBase}${url}`;
        const headers = {
            'x-service-token': SERVICE_TOKEN,
            'content-type': request.headers['content-type'] || 'application/json'
        };
        const authHeader = request.headers.authorization;
        if (authHeader) headers['authorization'] = authHeader;
        if (request.user) {
            headers['x-user-id'] = request.user.id;
            headers['x-user'] = JSON.stringify(request.user);
        }


        let body;
        if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
            body = typeof request.body === 'string'
                ? request.body
                : JSON.stringify(request.body || {});
        }

        const upstreamRes = await fetch(target, {
            method: request.method,
            headers,
            body
        });

        const text = await upstreamRes.text();
        let data;
        try {
            data = text ? JSON.parse(text) : null;
        } catch {
            data = text;
        }

        reply.code(upstreamRes.status);
        return reply.send(data);
   } catch (err) {
        fastify.log.error('Proxy error:', err);
        return reply.status(502).send({
            success: false,
            error: 'common.serviceUnavailable'
        });
    }
}

	await fastify.register(gdprRoutes, { prefix: '/api/gdpr' });

	await fastify.register(fastifyStatic, {
		root: path.join(__dirname, '../frontend'),
		prefix: '/'
	});

	const authUpstream = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
	const i18nUpstream = process.env.I18N_SERVICE_URL || 'http://localhost:3002';
	const databaseUpstream = process.env.DATABASE_SERVICE_URL || 'http://localhost:3003';
	const usersUpstream = process.env.USERS_SERVICE_URL || 'http://localhost:3004';


fastify.get('/api/auth/github',
    { preValidation: fastifyPassport.authenticate('github', { scope: ['user:email'], session: false }) },
    async (req, reply) => {}
);

fastify.get('/api/auth/github/callback',
{
    preValidation: fastifyPassport.authenticate('github', {
        failureRedirect: '/?error=auth_failed',
        session: false
    })
},
async (request, reply) => {
    const user = request.user;
    if (!user) return reply.redirect('/?error=user_not_found');

    const oauthProfile = {
        provider: 'github',
        id: user.id.toString(),
        username: user.username,
        email: user.email,
        avatar: user.avatar || 'default-avatar.png',
        profileUrl: user.profileUrl
    };

    const savedUser = await findOrCreateOAuthUser(oauthProfile);
    if (!savedUser) return reply.redirect('/?error=save_failed');

    const jwtToken = await jwtService.generateToken({
        id: savedUser.id,
        username: savedUser.username,
        email: savedUser.email,
        avatar: savedUser.avatar,
        twoFactorEnabled: savedUser.two_factor_enabled === true
    });

    return reply.redirect(`/?token=${jwtToken}`);
});


fastify.get('/api/auth/profile', async (request, reply) => {
    return proxyAPI(request, reply, authUpstream, true);
});

fastify.get('/api/auth/profile-data', async (request, reply) => {
    return proxyAPI(request, reply, authUpstream, true);
});

fastify.get('/health', async () => ({
	service: 'gateway',
    status: 'OK',
    success: true,
    timestamp: new Date().toISOString()
}));

fastify.get('/api/auth/health', async (request, reply) => {
    return proxyAPI(request, reply, authUpstream, true);
});

fastify.get('/api/i18n/health', async (request, reply) => {
    return proxyAPI(request, reply, i18nUpstream, true);
});

fastify.get('/api/database/health', async (request, reply) => {
    return proxyAPI(request, reply, databaseUpstream, true);
});

fastify.get('/api/users/health', async (request, reply) => {
    return proxyAPI(request, reply, usersUpstream, true);
});

fastify.route({
    method: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
    url: '/api/:service/*',
    handler: async (request, reply) => {
        const service = request.params.service;
        if (service === 'auth') {
            return proxyAPI(request, reply, authUpstream, true);
        }
        if (service === '2fa') {
            return proxyAPI(request, reply, authUpstream, true);
        }
        if (service === 'i18n') {
            return proxyAPI(request, reply, i18nUpstream, true);
        }
        if (service === 'database') {
            return proxyAPI(request, reply, databaseUpstream, false);
        }
        if (service === 'users') {
            return proxyAPI(request, reply, usersUpstream, true);
        }
        return reply.status(404).send({
            success: false,
            error: 'common.notFound'
        });
    }
});

	const port = process.env.GATEWAY_PORT || 3000;
	await fastify.listen({ port, host: '0.0.0.0' });
}

startGateway().catch(error => {
	console.error(error);
	process.exit(1);
});
