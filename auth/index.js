import createFastifyApp from '../shared/fastify-config.js';
import authRoutes from './routes/auth.js';
import twoFARoutes from './routes/2fa.js';
import healthRoutes from './routes/health.js';

async function startAuthService() {



const fastify = await createFastifyApp({
    serviceName: 'auth-service',
    enableSessions: true,
    corsOrigin: process.env.CORS_ORIGIN || 'https://localhost:8443'
});


	await fastify.register(authRoutes, { prefix: '/auth' });
	await fastify.register(twoFARoutes, { prefix: '/2fa' });
	await fastify.register(healthRoutes);

	const port = process.env.AUTH_SERVICE_PORT || 3001;
	await fastify.listen({ port, host: '0.0.0.0' });
}

startAuthService().catch(error => {
	console.error(error);
	process.exit(1);
});
