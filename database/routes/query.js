import db from '../config/sqlite.js';

export default async function queryRoutes(fastify, options) {

	fastify.get('/users/:id', async (request, reply) => {
		const { id } = request.params;
		try {
			const user = await db.get(
				'SELECT * FROM users WHERE id = ?',
				[id]
			);
			if (!user) {
				return reply.status(404).send({
					error: 'User not found',
					success: false,
					code: 'USER_NOT_FOUND'
				});
			}
			return { success: true, user };
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

	fastify.get('/users/email/:email', async (request, reply) => {
		const { email } = request.params;
		try {
			const user = await db.get(
				'SELECT * FROM users WHERE email = ?',
				[decodeURIComponent(email)]
			);
			if (!user) {
				return reply.status(404).send({
					error: 'User not found',
					success: false,
					code: 'USER_NOT_FOUND'
				});
			}
			return { success: true, user };
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

	fastify.post('/users', async (request, reply) => {
		const { id, username, email, password_hash, avatar, oauth_provider, oauth_id } = request.body;

		try {
			const result = await db.run(
				`INSERT INTO users (id, username, email, password_hash, avatar,
                 oauth_provider, oauth_id, two_factor_enabled, two_factor_secret,
                 is_active, is_anonymized, login_attempts, created_at, updated_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL, 1, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
				[id, username, email, password_hash, avatar, oauth_provider, oauth_id]
			);
			return { success: true, userId: id };
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

	fastify.put('/users/:id', async (request, reply) => {
		const userId = request.params.id;
		const updates = request.body;

		const fields = Object.keys(updates);
		if (fields.length === 0) {
			return reply.status(400).send({
				error: 'No fields to update',
				success: false,
				code: 'NO_UPDATES'
			});
		}

		const updateFields = fields.map(field => `${field} = ?`).join(', ');
		const values = fields.map(field => updates[field]);
		values.push(userId);

		try {
			await db.run(
				`UPDATE users SET ${updateFields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
				values
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

	fastify.delete('/users/:id', async (request, reply) => {
		const { id } = request.params;
		try {
			await db.run('DELETE FROM users WHERE id = ?', [id]);
			return { success: true };
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

	fastify.get('/users/all', async (request, reply) => {
		try {
			const users = await db.all('SELECT * FROM users ORDER BY created_at DESC');
			return { success: true, users };
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

	fastify.put('/users/:id/login-attempts', async (request, reply) => {
		const { id } = request.params;
		const { increment } = request.body;

		try {
			if (increment) {
				await db.run(
					'UPDATE users SET login_attempts = login_attempts + 1 WHERE id = ?',
					[id]
				);
			} else {
				await db.run(
					'UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?',
					[id]
				);
			}
			return { success: true };
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

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

	fastify.post('/backup-codes', async (request, reply) => {
		const { user_id, codes } = request.body;

		if (!user_id || !codes || !Array.isArray(codes)) {
			return reply.status(400).send({
				error: 'Invalid request data',
				success: false,
				code: 'INVALID_REQUEST'
			});
		}

		try {
			await db.run('DELETE FROM backup_codes WHERE user_id = ?', [user_id]);

			for (const code of codes) {
				await db.run(
					'INSERT INTO backup_codes (user_id, code_hash, used, created_at) VALUES (?, ?, 0, CURRENT_TIMESTAMP)',
					[user_id, code]
				);
			}
			return { success: true };
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

	fastify.get('/backup-codes/user/:userId', async (request, reply) => {
		const { userId } = request.params;
		try {
			const codes = await db.all(
				'SELECT id, code_hash, used FROM backup_codes WHERE user_id = ? ORDER BY created_at DESC',
				[userId]
			);
			return { success: true, codes };
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR'
			});
		}
	});

	fastify.put('/backup-codes/:id/use', async (request, reply) => {
		const { id } = request.params;
		try {
			await db.run(
				'UPDATE backup_codes SET used = 1 WHERE id = ?',
				[id]
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

	fastify.post('/query', async (request, reply) => {
		const { sql, params = [], type = 'all' } = request.body;

		if (!sql || typeof sql !== 'string') {
			return reply.status(400).send({
				error: 'SQL query required',
				success: false,
				code: 'SQL_REQUIRED'
			});
		}

		const safeSql = sql.trim().toUpperCase();
		const allowedPrefixes = ['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
		const isSafe = allowedPrefixes.some(prefix => safeSql.startsWith(prefix));

		if (!isSafe) {
			return reply.status(400).send({
				error: 'Unsafe SQL query type',
				success: false,
				code: 'UNSAFE_SQL',
				allowed: allowedPrefixes
			});
		}

		try {
			let result;
			switch (type) {
				case 'get':
					result = await db.get(sql, params);
					break;
				case 'run':
					result = await db.run(sql, params);
					break;
				case 'all':
				default:
					result = await db.all(sql, params);
			}

			return {
				success: true,
				type,
				result,
				timestamp: new Date().toISOString()
			};
		} catch (error) {
			return reply.status(500).send({
				error: 'Database error',
				success: false,
				code: 'DB_ERROR',
				message: error.message
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
