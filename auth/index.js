import createFastifyApp from '../shared/fastify-config.js';
import authRoutes from './routes/auth.js';
import twoFARoutes from './routes/2fa.js';
import userRoutes from './routes/user.js';
import gdprRoutes from './routes/gdpr.js';

async function startAuthService() {

	const fastify = await createFastifyApp({
		serviceName: 'auth-service',
		enableSessions: true,
		corsOrigin: true
	});

	await fastify.register(userRoutes, { prefix: '/auth' });
	await fastify.register(authRoutes, { prefix: '/auth' });
	await fastify.register(twoFARoutes, { prefix: '/2fa' });
	await fastify.register(gdprRoutes, { prefix: '/gdpr' });
	await fastify.listen({ host: '0.0.0.0', port: 3001 });
}

startAuthService().catch(error => {
	console.error(error);
	process.exit(1);
});
