import fastifyStatic from '@fastify/static';
import createFastifyApp from '../shared/fastify-config.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import gdprRoutes from './routes/gdpr.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const SERVICE_TOKEN = process.env.SERVICE_TOKEN || 'dev-service-token';

async function startGateway() {
	const fastify = await createFastifyApp({
		serviceName: 'api-gateway',
		enableSessions: false,
		corsOrigin: true
	});

	async function proxyAPI(request, reply, upstreamBase) {
		try {
			const url = request.url.replace(/^\/api\/[^/]+/, '');
			const target = `${upstreamBase}${url}`;

			const headers = {
				'x-service-token': SERVICE_TOKEN,
				'content-type': request.headers['content-type'] || 'application/json'
			};

			const authHeader = request.headers.authorization;
			if (authHeader) headers['authorization'] = authHeader;

			let body = undefined;
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

			const data = await upstreamRes.json();
			return reply.code(upstreamRes.status).send(data);
		} catch (err) {
			return reply.status(502).send({
				success: false,
				error: 'common.serviceUnavailable'
			});
		}
	}

	const authUpstream = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
	const i18nUpstream = process.env.I18N_SERVICE_URL || 'http://localhost:3002';
	const databaseUpstream = process.env.DATABASE_SERVICE_URL || 'http://localhost:3003';
	const usersUpstream = process.env.USERS_SERVICE_URL || 'http://localhost:3004';

	fastify.all('/api/auth/*', async (req, reply) => proxyAPI(req, reply, authUpstream));
	fastify.all('/api/2fa/*', async (req, reply) => proxyAPI(req, reply, authUpstream));
	fastify.all('/api/i18n/*', async (req, reply) => proxyAPI(req, reply, i18nUpstream));
	fastify.all('/api/database/*', async (req, reply) => proxyAPI(req, reply, databaseUpstream));
	fastify.all('/api/users/*', async (req, reply) => proxyAPI(req, reply, usersUpstream));

	await fastify.register(gdprRoutes, { prefix: '/api/gdpr' });

	await fastify.register(fastifyStatic, {
		root: path.join(__dirname, '../frontend'),
		prefix: '/'
	});

	fastify.get('/health', async () => ({
		gateway: 'OK',
		timestamp: new Date().toISOString()
	}));

	fastify.setNotFoundHandler((request, reply) => {
		if (request.url.startsWith('/api/')) {
			return reply.status(404).send({
				success: false,
				error: 'common.notFound'
			});
		}
		return reply.sendFile('index.html');
	});

	const port = process.env.GATEWAY_PORT || 3000;
	await fastify.listen({ port, host: '0.0.0.0' });
}

startGateway().catch(error => {
	console.error(error);
	process.exit(1);
});
