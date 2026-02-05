import createFastifyApp from '../shared/fastify-config.js';
import matchesRoutes from './routes/matches.js';
import tournamentsRoutes from './routes/tournaments.js';
import friendsRoutes from './routes/friends.js';
import usersRoutes from './routes/users.js';
import sessionsRoutes from './routes/sessions.js';
import playersRoutes from './routes/players.js';
import databaseRoutes from './routes/database.js';
import heartbeatRoutes from './routes/heartbeat.js';
import { markInactiveUsersOffline } from './routes/heartbeat.js';
import avatarRoutes from './routes/avatars.js';
import fastifyMultipart from '@fastify/multipart';

async function startDatabaseService() {
	const fastify = await createFastifyApp({
		serviceName: 'database-service',
		corsOrigin: true
	});

	// Register multipart BEFORE routes
	await fastify.register(fastifyMultipart, {
		limits: {
			fileSize: 2 * 1024 * 1024, // 2MB
			files: 1
		}
	});

	await fastify.register(databaseRoutes, { prefix: '/database' });
	await fastify.register(usersRoutes, { prefix: '/database' });
	await fastify.register(sessionsRoutes, { prefix: '/database' });
	await fastify.register(matchesRoutes, { prefix: '/database' });
	await fastify.register(tournamentsRoutes, { prefix: '/database' });
	await fastify.register(friendsRoutes, { prefix: '/database' });
	await fastify.register(friendsRoutes, { prefix: '/database/friends' });
	await fastify.register(playersRoutes, { prefix: '/database' });
	await fastify.register(heartbeatRoutes, { prefix: '/database' });
	await fastify.register(avatarRoutes, { prefix: '/database' });

	await fastify.listen({ host: '0.0.0.0', port: 3003 });

	// Start offline cleanup - mark inactive users offline every 60 seconds
	console.log('✅ Starting offline cleanup task...');
	markInactiveUsersOffline(); // Run immediately
	setInterval(() => {
		markInactiveUsersOffline();
	}, 60000); // Run every 60 seconds
}

startDatabaseService().catch(error => {
	console.error(error);
	process.exit(1);
});