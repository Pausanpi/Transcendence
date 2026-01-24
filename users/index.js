import createFastifyApp from '../shared/fastify-config.js';
import userRoutes from './routes/users.js';

async function startUserService() {

	const fastify = await createFastifyApp({
		serviceName: 'users-service',
		corsOrigin: true
	});

	await fastify.register(userRoutes, { prefix: '/users' });
	await fastify.listen({ host: '0.0.0.0', port: 3004 });
}
startUserService().catch(error => {
	console.error(error);
	process.exit(1);
});
