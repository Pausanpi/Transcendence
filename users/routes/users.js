import { findUserById, getAllUsers, isUserAdmin } from '../models/User.js';
import { authenticateJWT } from '../../auth/middleware/auth.js';
import fastifyStatic from '@fastify/static';
export default async function adminRoutes(fastify, options) {
	async function requireAdmin(request, reply) {
		return; // BYPASS TEMPORAL TODO, BORRAR
		try {
			const user = await findUserById(request.user.id);
			if (!user || !isUserAdmin(user)) {
				return reply.status(403).send({
					error: 'admin.accessDenied',
					code: 'ACCESS_DENIED'
				});
			}
		} catch (error) {
			return reply.status(403).send({
				error: 'admin.accessDenied',
				code: 'ACCESS_DENIED'
			});
		}
	}

	fastify.get('/check-status', {
		preHandler: [authenticateJWT]
	}, async (request, reply) => {
		try {
			const user = await findUserById(request.user.id);
			return { isAdmin: user ? isUserAdmin(user) : false };
		} catch (error) {
			return { isAdmin: false };
		}
	});

	fastify.get('/list', {
		preHandler: [authenticateJWT]
	}, async (request, reply) => {
		try {
			const users = await getAllUsers();
			const safeUsers = users.map(user => ({
				id: user.id,
				username: user.username || 'N/A',
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
}
