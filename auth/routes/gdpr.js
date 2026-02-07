import gdprService from '../services/gdpr.js';
import { findUserById } from '../services/user.js';
import jwtService from '../services/jwt.js';

export default async function gdprRoutes(fastify, options) {

	async function authenticateUser(request, reply) {
		const authHeader = request.headers.authorization;

		if (!authHeader?.startsWith('Bearer ')) {
			return reply.status(401).send({
				success: false,
				error: 'messages.authError'
			});
		}

		const token = authHeader.substring(7);
		const decoded = await jwtService.verifyToken(token);

		if (!decoded?.id) {
			return reply.status(401).send({
				success: false,
				error: 'auth.invalidToken'
			});
		}

		request.user = decoded;
	}

	fastify.get('/user-data', {
		preHandler: authenticateUser
	}, async (request, reply) => {
		try {
			const user = await findUserById(request.user.id);
			if (!user) {
				return reply.status(404).send({
					success: false,
					error: 'messages.userNotFound'
				});
			}

			const dataSummary = await gdprService.getUserDataSummary(user.id);

			return {
				success: true,
				data: {
					profile: user.toSafeJSON(),
					dataSummary
				}
			};
		} catch (error) {
			fastify.log.error('GDPR user-data error:', error);
			return reply.status(500).send({
				success: false,
				error: 'common.internalError'
			});
		}
	});

	fastify.get('/user-consent', {
		preHandler: authenticateUser
	}, async (request, reply) => {
		try {
			const user = await findUserById(request.user.id);
			if (!user) {
				return reply.status(404).send({
					success: false,
					error: 'messages.userNotFound'
				});
			}

			return {
				success: true,
				consent: {
					dataProcessing: user.consent_data_processing === 1,
					marketingEmails: user.consent_marketing === 1,
					analytics: user.consent_analytics === 1
				}
			};
		} catch (error) {
			return reply.status(500).send({
				success: false,
				error: 'common.internalError'
			});
		}
	});

	fastify.post('/anonymize', {
		preHandler: authenticateUser
	}, async (request, reply) => {
		try {
			if (request.body && request.body._dummy) {
      delete request.body._dummy;
    }

			const user = await findUserById(request.user.id);
			if (!user) {
				return reply.status(404).send({
					success: false,
					error: 'messages.userNotFound'
				});
			}
			const success = await gdprService.anonymizeUserData(user.id);
			if (!success) {
				return reply.status(500).send({
					success: false,
					error: 'gdpr.anonymizationError'
				});
			}

			return {
				success: true,
				message: 'messages.dataAnonymized'
			};
		} catch (error) {
			return reply.status(500).send({
				success: false,
				error: `gdpr.anonymizationError ${request.user.id}`
			});
		}
	});

	fastify.post('/export-data', {
		preHandler: authenticateUser
	}, async (request, reply) => {
		try {
			if (request.body && request.body._dummy) {
      delete request.body._dummy;
    }
			const user = await findUserById(request.user.id);
			if (!user) {
				return reply.status(404).send({
					success: false,
					error: 'messages.userNotFound'
				});
			}

			const exportData = await gdprService.exportUserData(user.id);
			if (!exportData) {
				return reply.status(500).send({
					success: false,
					error: 'gdpr.exportError'
				});
			}

			return {
				success: true,
				data: exportData,
				format: 'json',
				generatedAt: new Date().toISOString()
			};
		} catch (error) {
			return reply.status(500).send({
				success: false,
				error: 'gdpr.exportError'
			});
		}
	});

	fastify.post('/delete-account', {
		preHandler: authenticateUser
	}, async (request, reply) => {
		try {
			const { confirmation } = request.body;
			const user = await findUserById(request.user.id);

			if (!user) {
				return reply.status(404).send({
					success: false,
					error: 'messages.userNotFound'
				});
			}

			const confirmationText = 'DELETE MY ACCOUNT';
			if (confirmation !== confirmationText) {
				return reply.status(400).send({
					success: false,
					error: 'gdpr.invalidConfirmation'
				});
			}

			const success = await gdprService.deleteUserAccount(user.id);
			if (!success) {
				return reply.status(500).send({
					success: false,
					error: 'gdpr.deletionError'
				});
			}

			return {
				success: true,
				message: 'messages.accountDeleted'
			};
		} catch (error) {
			return reply.status(500).send({
				success: false,
				error: 'gdpr.deletionError'
			});
		}
	});

	fastify.post('/update-consent', {
		preHandler: authenticateUser
	}, async (request, reply) => {
		try {
			const { marketingEmails, analytics, dataProcessing } = request.body;
			const user = await findUserById(request.user.id);

			if (!user) {
				return reply.status(404).send({
					success: false,
					error: 'messages.userNotFound'
				});
			}

			const success = await gdprService.updateUserConsent(user.id, {
				marketingEmails: Boolean(marketingEmails),
				analytics: Boolean(analytics),
				dataProcessing: Boolean(dataProcessing),
				consentUpdatedAt: new Date().toISOString()
			});

			if (!success) {
				return reply.status(500).send({
					success: false,
					error: 'gdpr.consentUpdateError'
				});
			}

			return {
				success: true,
				message: 'messages.preferencesUpdated'
			};
		} catch (error) {
			return reply.status(500).send({
				success: false,
				error: 'gdpr.consentUpdateError'
			});
		}
	});
}
