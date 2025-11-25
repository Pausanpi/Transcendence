import { findUserById, updateUser, deleteUser, anonymizeUser } from '../models/User.js';
import { deleteUserSessions } from '../models/Session.js';
import gdprService from '../services/gdpr.js';
import { authenticateJWT } from '../middleware/auth.js';
export default async function gdprRoutes(fastify, options) {
	fastify.get('/management', async (request, reply) => {
		if (!request.isAuthenticated()) {
			return reply.redirect('/');
		}
		return reply.sendFile('auth/gdpr.html');
	});
	fastify.get('/user-data', {
		preHandler: authenticateJWT
	}, async (request, reply) => {
		try {
			const user = await findUserById(request.user.id);
			if (!user) {
				return reply.status(404).send({
					error: 'messages.userNotFound',
					code: 'USER_NOT_FOUND'
				});
			}
			const userData = {
				profile: user.toSafeJSON(),
				dataSummary: await gdprService.getUserDataSummary(user.id)
			};
			return {
				success: true,
				data: userData
			};
		} catch (error) {
			console.error('Error obtaining user data:', error);
			return reply.status(500).send({
				error: 'common.internalError',
				code: 'DATA_RETRIEVAL_ERROR'
			});
		}
	});
	fastify.post('/anonymize', {
		preHandler: authenticateJWT
	}, async (request, reply) => {
		try {
			const user = await findUserById(request.user.id);
			if (!user) {
				return reply.status(404).send({
					error: 'messages.userNotFound',
					code: 'USER_NOT_FOUND'
				});
			}
			const anonymizedUser = await gdprService.anonymizeUserData(user.id);
			if (request.session) {
				request.session.destroy();
			}
			return {
				success: true,
				message: 'messages.dataAnonymized',
				anonymizedId: anonymizedUser.id
			};
		} catch (error) {
			console.error('Error anonymizing data:', error);
			return reply.status(500).send({
				error: 'gdpr.anonymizationError',
				code: 'ANONYMIZATION_ERROR'
			});
		}
	});
	fastify.post('/export-data', {
		preHandler: authenticateJWT
	}, async (request, reply) => {
		try {
			const user = await findUserById(request.user.id);
			if (!user) {
				return reply.status(404).send({
					error: 'messages.userNotFound',
					code: 'USER_NOT_FOUND'
				});
			}
			const exportData = await gdprService.exportUserData(user.id);
			return {
				success: true,
				data: exportData,
				format: 'json',
				generatedAt: new Date().toISOString()
			};
		} catch (error) {
			console.error('Error exporting data:', error);
			return reply.status(500).send({
				error: 'gdpr.exportError',
				code: 'EXPORT_ERROR'
			});
		}
	});
	fastify.post('/delete-account', {
		preHandler: authenticateJWT
	}, async (request, reply) => {
		try {
			const { confirmation } = request.body;
			if (!confirmation || confirmation !== 'ELIMINAR MI CUENTA') {
				return reply.status(400).send({
					error: 'gdpr.confirmationRequired',
					code: 'CONFIRMATION_REQUIRED'
				});
			}
			const user = await findUserById(request.user.id);
			if (!user) {
				return reply.status(404).send({
					error: 'messages.userNotFound',
					code: 'USER_NOT_FOUND'
				});
			}
			await gdprService.deleteUserAccount(user.id);
			if (request.session) {
				request.session.destroy();
			}
			return {
				success: true,
				message: 'messages.accountDeleted'
			};
		} catch (error) {
			console.error('Error deleting account:', error);
			return reply.status(500).send({
				error: 'gdpr.deletionError',
				code: 'DELETION_ERROR'
			});
		}
	});
	fastify.post('/update-consent', {
		preHandler: authenticateJWT
	}, async (request, reply) => {
		try {
			const { marketingEmails, analytics, dataProcessing } = request.body;
			const user = await findUserById(request.user.id);
			if (!user) {
				return reply.status(404).send({
					error: 'messages.userNotFound',
					code: 'USER_NOT_FOUND'
				});
			}
			await gdprService.updateUserConsent(user.id, {
				marketingEmails: Boolean(marketingEmails),
				analytics: Boolean(analytics),
				dataProcessing: Boolean(dataProcessing),
				consentUpdatedAt: new Date().toISOString()
			});
			return {
				success: true,
				message: 'messages.preferencesUpdated'
			};
		} catch (error) {
			console.error('Error updating consent:', error);
			return reply.status(500).send({
				error: 'gdpr.consentUpdateError',
				code: 'CONSENT_UPDATE_ERROR'
			});
		}
	});
}
