import createFastifyApp from '../shared/fastify-config.js';
import adminRoutes from './routes/users.js';
import healthRoutes from './routes/health.js';
import dotenv from 'dotenv';

dotenv.config();

async function startUserService() {
const fastify = await createFastifyApp({
    serviceName: 'users-service',
    corsOrigin: process.env.CORS_ORIGIN || 'https://localhost:8443'
});


	await fastify.register(adminRoutes, { prefix: '/users' });
	await fastify.register(healthRoutes);

	const port = process.env.USERS_SERVICE_PORT || 3004;
	await fastify.listen({
		port: port,
		host: '0.0.0.0'
	});

}
startUserService().catch(error => {
	process.exit(1);
});
