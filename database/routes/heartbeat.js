import db from '../config/sqlite.js';

// Helper function to update user online status
export async function updateUserOnlineStatus(userId, status) {
	try {
		await db.run(
			`UPDATE users SET online_status = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?`,
			[status, userId]
		);
	} catch (error) {
		console.error('Error updating online status:', error);
		throw error;
	}
}

// Mark users as offline if they haven't sent a heartbeat in 2 minutes
export async function markInactiveUsersOffline() {
	try {
		await db.run(
			`UPDATE users 
			 SET online_status = 'offline' 
			 WHERE online_status = 'online' 
			 AND datetime(last_seen) < datetime('now', '-2 minutes')`
		);
	} catch (error) {
		console.error('Error marking inactive users offline:', error);
	}
}

export default async function heartbeatRoutes(fastify, options) {
	
	// Heartbeat endpoint - updates user's last_seen and online_status
	fastify.post('/heartbeat', async (request, reply) => {
		const userId = request.headers['x-user-id'];
		if (!userId) {
			return reply.status(401).send({ success: false, error: 'auth.required' });
		}

		try {
			await updateUserOnlineStatus(userId, 'online');
			return {
				success: true,
				timestamp: new Date().toISOString()
			};
		} catch (error) {
			console.error('Heartbeat error:', error);
			return reply.status(500).send({
				success: false,
				error: 'common.internalError'
			});
		}
	});

	// Optional: Logout endpoint to explicitly set offline
	fastify.post('/logout', {
		preHandler: fastify.authenticate
	}, async (request, reply) => {
		try {
			const userId = request.user.id;
			
			await updateUserOnlineStatus(userId, 'offline');
			
			return {
				success: true
			};
		} catch (error) {
			console.error('Logout error:', error);
			return reply.status(500).send({
				success: false,
				error: 'common.internalError'
			});
		}
	});
}