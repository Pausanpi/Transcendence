import createFastifyApp from '../shared/fastify-config.js';
import dotenv from 'dotenv';

import queryRoutes from './routes/query.js';

dotenv.config();

async function startDatabaseService() {

	const fastify = await createFastifyApp({
		serviceName: 'database-service',
		enableSessions: true,
		corsOrigin: process.env.CORS_ORIGIN || true
	});

	await fastify.register(queryRoutes);

	fastify.addHook('onRequest', async (request, reply) => {
		if (request.method === 'GET' && request.url.startsWith('/health')) return;
		const serviceToken = request.headers['x-service-token'];
		const validToken = process.env.SERVICE_TOKEN;
	});

	const port = process.env.DATABASE_SERVICE_PORT || 3003;
	await fastify.listen({
		port: port,
		host: '0.0.0.0'
	});

}
startDatabaseService().catch(error => {
	process.exit(1);
});
