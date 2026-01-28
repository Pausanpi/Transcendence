import db from '../config/sqlite.js';

export default async function databaseRoutes(fastify, options) {

		fastify.get('/health', async () => {
		try {
			await db.get('SELECT 1 as test');
			return {
				service: 'database-service',
				status: 'OK',
				url: 'http://database:3003',
				database: 'connected',
				timestamp: new Date().toISOString(),
				endpoints: [
					'/users/:id',
					'/users/email/:email',
					'/users',
					'/users/all',
					'/sessions',
					'/backup-codes',
					'/query'
				]
			};
		} catch (error) {
			return {
				service: 'database-service',
				status: 'ERROR',
				database: 'disconnected',
				success: false,
				error: error.message,
				timestamp: new Date().toISOString()
			};
		}
	});

	fastify.get('/metrics', async (request, reply) => {
		reply.header('Content-Type', 'text/plain; version=0.0.4');
		const metrics = `
	# HELP service_health Service health status (1 = UP, 0 = DOWN)
	# TYPE service_health gauge
	service_health{service="auth"} 1
	`;

		return metrics;
	});

}
