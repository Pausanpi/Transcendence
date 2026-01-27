
import { fileURLToPath } from 'url';
import createFastifyApp from '../shared/fastify-config.js';
import fastifyMultipart from '@fastify/multipart';

//import fastifyStatic from '@fastify/static';
import gatewayRoutes from './routes/gateway.js';
import jwt from 'jsonwebtoken';

import path from 'path';
//import VaultService from '../auth/services/vault.js';
import fs from 'fs/promises';



const avatarsDir = '../frontend/avatars';
await fs.mkdir(avatarsDir, { recursive: true });

const gatewayUpstream = 'http://gateway:3000';
const authUpstream = 'http://auth:3001';
const i18nUpstream = 'http://i18n:3002';
const databaseUpstream = 'http://database:3003';
const usersUpstream = 'http://users:3004';

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)


// Fetch secrets from the auth service's vault endpoints directly
const serviceTokenRes = await fetch(`${authUpstream}/vault/secret/service-token`);
if (!serviceTokenRes.ok) throw new Error('Service secret not found in Vault');
const { token: serviceToken } = await serviceTokenRes.json();
if (!serviceToken) {
	throw new Error('Service secret not found in Vault');
}

const jwtSecretRes = await fetch(`${authUpstream}/vault/secret/jwt`);
if (!jwtSecretRes.ok) throw new Error('JWT secret not found in Vault');
const { secret: jwtSecret } = await jwtSecretRes.json();
if (!jwtSecret) {
	throw new Error('JWT secret not found in Vault');
}
async function startGateway() {

	const fastify = await createFastifyApp({
		serviceName: 'api-gateway',
		enableSessions: true,
		corsOrigin: true,
		getSessionSecret: async () => {
			const sessionSecretRes = await fetch(`${authUpstream}/vault/secret/session`);
			if (!sessionSecretRes.ok) throw new Error('Session secret not found in Vault');
			const { secret } = await sessionSecretRes.json();
			return secret;
		}
	});

  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 2 * 1024 * 1024,
      files: 1
    }
  });

	await fastify.register(gatewayRoutes, { prefix: '/gateway' });

	fastify.addHook('onRequest', async (request, reply) => {
		if (!request.url.startsWith('/api/')) return;

		const publicRoutes = [
			'/api/2fa/verify-login',
			'/api/oauth/github',
			'/api/oauth/github/callback',
			'/api/auth/health',
			'/api/auth/login',
			'/api/auth/register',
			'/api/database/health',
			'/api/gateway/health',
			'/api/i18n/',
			'/api/users/health',
			'/api/database/players',
			'/api/gateway/upload/avatar',
			'/api/gateway/upload/'
			
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

		if (!jwtSecret) {
			return reply.status(500).send({ success: false, error: 'JWT secret not available' });
		}

// Call auth service API for JWT verification
		try {
			const response = await fetch('http://auth:3001/auth/jwt/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token })
			});
			const result = await response.json();

			if (!result.success || !result.decoded?.id) {
				return reply.status(401).send({
					success: false,
					error: 'auth.invalidToken'
				});
			}
			request.user = result.decoded;
		} catch (err) {
			fastify.log.error('JWT verification via auth service failed:', err.message);
			return reply.status(502).send({
				success: false,
				error: 'auth.verificationFailed'
			});
		}
	});

	async function proxyAPI(request, reply, upstreamBase) {
		try {
			let url = request.url.replace(/^\/api/, '');
			const target = `${upstreamBase}${url}`;
			const headers = { 'x-service-token': serviceToken };
			if (request.headers['content-type']) {
				headers['content-type'] = request.headers['content-type'];
			}

			const authHeader = request.headers.authorization;
			if (authHeader) headers['authorization'] = authHeader;
			if (request.user) {
				headers['x-user-id'] = request.user.id;
				headers['x-user'] = JSON.stringify(request.user);
			}

			let body;
			if (
				!['GET', 'HEAD', 'OPTIONS'].includes(request.method) &&
				request.body !== undefined
			) {
				body = typeof request.body === 'string'
					? request.body
					: JSON.stringify(request.body);
			}

			const upstreamRes = await fetch(target, {
				method: request.method,
				headers,
				body,
				redirect: 'manual'
			});

			if (upstreamRes.status >= 300 && upstreamRes.status < 400) {
				const location = upstreamRes.headers.get('location');
				if (location) {
					reply.code(upstreamRes.status);
					reply.header('location', location);
					return reply.send();
				}
			}

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

	fastify.route({
		method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		url: '/api/:service/*',
		handler: async (request, reply) => {
			const service = request.params.service;
			if (service === 'auth') {
				return proxyAPI(request, reply, authUpstream);
			}
			if (service === 'oauth') {
				return proxyAPI(request, reply, authUpstream);
			}
			if (service === '2fa') {
				return proxyAPI(request, reply, authUpstream);
			}
			if (service === 'gdpr') {
				return proxyAPI(request, reply, authUpstream);
			}
			if (service === 'i18n') {
				return proxyAPI(request, reply, i18nUpstream);
			}
			if (service === 'database') {
				return proxyAPI(request, reply, databaseUpstream);
			}
			if (service === 'users') {
				return proxyAPI(request, reply, usersUpstream);
			}
			if (service === 'gateway') {
				return proxyAPI(request, reply, gatewayUpstream);
			}
			if (service === 'friends') {
				return proxyAPI(request, reply, databaseUpstream);
			}
			if (service === 'upload') {
				return proxyAPI(request, reply, gatewayUpstream);
			}
			return reply.status(404).send({
				success: false,
				error: 'common.notFound'
			});
		}
	});

	await fastify.listen({ host: '0.0.0.0', port: 3000 });
}

startGateway().catch(error => {
	console.error(error);
	process.exit(1);
});
