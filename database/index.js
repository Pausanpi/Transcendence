import createFastifyApp from '../shared/fastify-config.js';
import matchesRoutes from './routes/matches.js';
import tournamentsRoutes from './routes/tournaments.js';
import friendsRoutes from './routes/friends.js';
import usersRoutes from './routes/users.js';
import sessionsRoutes from './routes/sessions.js';
import playersRoutes from './routes/players.js';
import databaseRoutes from './routes/database.js';

async function startDatabaseService() {
	const fastify = await createFastifyApp({
		serviceName: 'database-service',
		corsOrigin: true
	});

	await fastify.register(databaseRoutes, { prefix: '/database' });
	await fastify.register(usersRoutes, { prefix: '/database' });
	await fastify.register(sessionsRoutes, { prefix: '/database' });
	await fastify.register(matchesRoutes, { prefix: '/database' });
	await fastify.register(tournamentsRoutes, { prefix: '/database' });
	await fastify.register(friendsRoutes, { prefix: '/database' });
	await fastify.register(friendsRoutes, { prefix: '/database/friends' });
	await fastify.register(playersRoutes, { prefix: '/database' });
	await fastify.listen({ host: '0.0.0.0', port: 3003 });
}

startDatabaseService().catch(error => {
	console.error(error);
	process.exit(1);
});
