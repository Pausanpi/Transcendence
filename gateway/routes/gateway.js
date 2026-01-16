import jwt from 'jsonwebtoken';

const SERVICE_TOKEN = process.env.SERVICE_TOKEN || 'dev-service-token';

export default async function gatewayRoutes(fastify, options) {
	const jwtSecret = process.env.JWT_SECRET || 'dev-fallback-secret';

	fastify.addHook('onRequest', async (request, reply) => {
	if (
		!request.url.startsWith('/api/') ||
		request.url.startsWith('/api/auth/login') ||
		request.url.startsWith('/api/auth/register') ||
		request.url.startsWith('/api/auth/2fa') ||
		request.url.startsWith('/api/auth/github') ||
		request.url.startsWith('/api/i18n/')
	) {
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
			const decoded = jwt.verify(token, jwtSecret, {
				issuer: 'auth-service',
				audience: 'user'
			});
			request.user = decoded;
		} catch {
			return reply.status(401).send({
				success: false,
				error: 'auth.invalidToken'
			});
		}
	});

	fastify.get('/health', async () => ({
		gateway: 'OK',
		timestamp: new Date().toISOString(),
		endpoints: [
			'/api/auth',
			'/api/2fa',
			'/api/i18n',
			'/api/users',
			'/api/database',
			'/api/gdpr'
		]
	}));

	fastify.get('/ready', async () => {
		try {
			const databaseUrl = process.env.DATABASE_SERVICE_URL || 'http://localhost:3003';
			const response = await fetch(`${databaseUrl}/health`);
			const data = await response.json();
			return { status: 'ready', database: data.status === 'OK' ? 'connected' : 'error' };
		} catch (error) {
			return { status: 'not-ready', database: 'error', error: error && error.message };
		}
	});

	fastify.get('/api/auth/profile-data', async (request, reply) => {
		if (!request.user?.id) {
			return reply.status(401).send({
				error: 'messages.authError',
				code: 'AUTH_REQUIRED'
			});
		}

		const upstream = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
		const url = `${upstream}/auth/profile-data`;

		try {
			const headers = {
				'x-service-token': SERVICE_TOKEN,
				'x-forwarded-for': request.headers['x-forwarded-for'] || '',
				'x-user-id': request.user.id,
				'x-user': JSON.stringify(request.user),
				'authorization': request.headers.authorization
			};

			const response = await fetch(url, { headers });
			const data = await response.json();

			reply.code(response.status);
			return reply.send(data);
		} catch {
			return reply.status(502).send({
				error: 'Service unavailable',
				code: 'SERVICE_ERROR'
			});
		}
	});


	const proxy = (await import('@fastify/http-proxy')).default;

	fastify.register(proxy, {
		upstream: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
		prefix: '/api/auth',
		rewritePrefix: '',
		http2: false
	});

	fastify.register(proxy, {
		upstream: process.env.I18N_SERVICE_URL || 'http://localhost:3002',
		prefix: '/api/i18n',
		rewritePrefix: '',
		http2: false
	});

	fastify.register(proxy, {
		upstream: process.env.USERS_SERVICE_URL || 'http://localhost:3004',
		prefix: '/api/users',
		rewritePrefix: '',
		http2: false
	});



}
