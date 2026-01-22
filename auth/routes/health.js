export default async function healthRoutes(fastify, options) {
	fastify.get('/health', async () => ({
		service: 'auth-service',
		status: 'OK',
		url: process.env.AUTH_SERVICE_PORT,
		timestamp: new Date().toISOString(),
		version: '1.0.0',
		endpoints: ['/auth', '/2fa']
	}));

	fastify.get('/auth/health', async () => ({
		service: 'auth-service',
		status: 'OK',
		url: process.env.AUTH_SERVICE_PORT,
		timestamp: new Date().toISOString(),
		version: '1.0.0',
		endpoints: ['/auth', '/2fa']
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
}
