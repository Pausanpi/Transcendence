

import db from '../config/sqlite.js';

export default async function sessionsRoutes(fastify, options) {



	fastify.post('/sessions', async (request, reply) => {
		const { id, user_id, jwt_token, expires_at } = request.body;

		try {
			await db.run(
				`INSERT INTO user_sessions (id, user_id, jwt_token, expires_at, created_at)
				 VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
				[id, user_id, jwt_token, expires_at]
			);
			return { success: true };
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

	fastify.delete('/sessions/user/:userId', async (request, reply) => {
		const { userId } = request.params;
		try {
			await db.run('DELETE FROM user_sessions WHERE user_id = ?', [userId]);
			return { success: true };
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

	fastify.get('/sessions/user/:userId', async (request, reply) => {
		const { userId } = request.params;
		try {
			const sessions = await db.all(
				'SELECT * FROM user_sessions WHERE user_id = ? ORDER BY created_at DESC',
				[userId]
			);
			return { success: true, sessions };
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});


	fastify.get('/health', async () => {
		try {
			await db.get('SELECT 1 as test');
			return {
				service: 'database-service',
				status: 'OK',
				url: process.env.DATABASE_SERVICE_PORT,
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
}
