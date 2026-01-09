import createFastifyApp from '../shared/fastify-config.js';
import dotenv from 'dotenv';
import healthRoutes from './routes/health.js';
import queryRoutes from './routes/query.js';
import matchesRoutes from './routes/matches.js';
import tournamentsRoutes from './routes/tournaments.js';
import friendsRoutes from './routes/friends.js';

dotenv.config();

async function startDatabaseService() {

const fastify = await createFastifyApp({
    serviceName: 'database-service',
    corsOrigin: process.env.CORS_ORIGIN || 'https://localhost:8443'
});

//await fastify.register(queryRoutes, { prefix: '/database' });

await fastify.register(queryRoutes);
await fastify.register(matchesRoutes);
await fastify.register(tournamentsRoutes);
await fastify.register(friendsRoutes);
await fastify.register(healthRoutes);

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
