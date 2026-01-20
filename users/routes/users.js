import { getAllUsers } from '../../auth/services/user.js';
import { authenticateJWT } from '../../auth/middleware/auth.js';

export default async function userRoutes(fastify, options) {

	fastify.get('/list', {
		preHandler: [authenticateJWT]
	}, async (request, reply) => {
		try {
			const users = await getAllUsers();
			const safeUsers = users.map(user => ({
				id: user.id,
				username: user.username || 'N/A',
				displayName: user.display_name || 'N/A',
				email: user.email || 'N/A',
				twoFactorEnabled: user.twoFactorEnabled || false,
				isActive: user.isActive !== false,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt,
				oauthProvider: user.oauth_provider,
				isAnonymized: user.isAnonymized || false
			}));
			return { success: true, users: safeUsers };
		} catch (error) {
			return reply.status(500).send({
				error: 'admin.errorLoading',
				code: 'USERS_LOAD_ERROR'
			});
		}
	});

	fastify.get('/health', async () => {
		return {
			service: 'users-service',
			status: 'OK',
			timestamp: new Date().toISOString(),
			endpoints: ['/users']
		};
	});

	fastify.get('/users/health', async () => {
		return {
			service: 'users-service',
			status: 'OK',
			timestamp: new Date().toISOString(),
			endpoints: ['/users']
		};
	});

}
