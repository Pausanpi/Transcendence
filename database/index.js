import createFastifyApp from '../shared/fastify-config.js';
import matchesRoutes from './routes/matches.js';
import tournamentsRoutes from './routes/tournaments.js';
import friendsRoutes from './routes/friends.js';
import usersRoutes from './routes/users.js';
import sessionsRoutes from './routes/sessions.js';
import playersRoutes from './routes/players.js';

async function startDatabaseService() {
	const fastify = await createFastifyApp({
		serviceName: 'database-service',
		corsOrigin: true
	});

	await fastify.register(usersRoutes);
	await fastify.register(sessionsRoutes);
	await fastify.register(matchesRoutes);
	await fastify.register(tournamentsRoutes);
	await fastify.register(friendsRoutes);
	await fastify.register(playersRoutes);
	await fastify.listen({ host: '0.0.0.0', port: 3003 });
}

startDatabaseService().catch(error => {
	console.error(error);
	process.exit(1);
});
