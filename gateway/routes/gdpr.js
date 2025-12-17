import gdprService from '../../database/services/gdpr.js';
import { findUserById } from '../../users/models/User.js';

export default async function gdprRoutes(fastify, options) {
    async function authenticateUser(request, reply) {
        if (!request.isAuthenticated?.()) {
            return reply.status(401).send({
                error: 'messages.authError',
                code: 'AUTH_REQUIRED'
            });
        }
        if (!request.user?.id) {
            const userId = request.session?.get?.('userId');
            if (!userId) {
                return reply.status(401).send({
                    error: 'messages.authError',
                    code: 'INVALID_USER'
                });
            }
            request.user = { id: userId };
        }
    }

    fastify.get('/user-data', {
        preHandler: authenticateUser
    }, async (request, reply) => {
        try {
            fastify.log.info('GDPR user-data request for user:', request.user?.id);

            const user = await findUserById(request.user.id);
            if (!user) {
                fastify.log.error('User not found:', request.user.id);
                return reply.status(404).send({
                    success: false,
                    error: 'messages.userNotFound',
                    code: 'USER_NOT_FOUND'
                });
            }

            const dataSummary = await gdprService.getUserDataSummary(user.id);
            const userData = {
                profile: user.toSafeJSON(),
                dataSummary: dataSummary
            };

            fastify.log.info('GDPR user-data success');
            return {
                success: true,
                data: userData
            };
        } catch (error) {
            fastify.log.error('GDPR user-data error:', error);
            return reply.status(500).send({
                success: false,
                error: 'common.internalError',
                code: 'DATA_RETRIEVAL_ERROR',
                message: error.message
            });
        }
    });

    fastify.get('/user-consent', {
        preHandler: authenticateUser
    }, async (request, reply) => {
        try {
            fastify.log.info('GDPR user-consent request for user:', request.user?.id);

            const user = await findUserById(request.user.id);
            if (!user) {
                return reply.status(404).send({
                    success: false,
                    error: 'messages.userNotFound',
                    code: 'USER_NOT_FOUND'
                });
            }

const consent = {
    dataProcessing: user.consent_data_processing === 1,
    marketingEmails: user.consent_marketing === 1,
    analytics: user.consent_analytics === 1
};

            fastify.log.info('GDPR user-consent success');
            return {
                success: true,
                consent
            };
        } catch (error) {
            fastify.log.error('GDPR user-consent error:', error);
            return reply.status(500).send({
                success: false,
                error: 'common.internalError',
                code: 'CONSENT_RETRIEVAL_ERROR',
                message: error.message
            });
        }
    });

    fastify.post('/anonymize', {
        preHandler: authenticateUser
    }, async (request, reply) => {
        try {
            fastify.log.info('GDPR anonymize request for user:', request.user?.id);

            const user = await findUserById(request.user.id);
            if (!user) {
                return reply.status(404).send({
                    success: false,
                    error: 'messages.userNotFound',
                    code: 'USER_NOT_FOUND'
                });
            }

            const success = await gdprService.anonymizeUserData(user.id);
            if (!success) {
                return reply.status(500).send({
                    success: false,
                    error: 'gdpr.anonymizationError',
                    code: 'ANONYMIZATION_ERROR'
                });
            }

            if (request.session?.destroy) {
                request.session.destroy();
            }

            fastify.log.info('GDPR anonymize success');
            return {
                success: true,
                message: 'messages.dataAnonymized'
            };
        } catch (error) {
            fastify.log.error('GDPR anonymize error:', error);
            return reply.status(500).send({
                success: false,
                error: 'gdpr.anonymizationError',
                code: 'ANONYMIZATION_ERROR',
                message: error.message
            });
        }
    });

    fastify.post('/export-data', {
        preHandler: authenticateUser
    }, async (request, reply) => {
        try {
            fastify.log.info('GDPR export-data request for user:', request.user?.id);

            const user = await findUserById(request.user.id);
            if (!user) {
                return reply.status(404).send({
                    success: false,
                    error: 'messages.userNotFound',
                    code: 'USER_NOT_FOUND'
                });
            }

            const exportData = await gdprService.exportUserData(user.id);
            if (!exportData) {
                return reply.status(500).send({
                    success: false,
                    error: 'gdpr.exportError',
                    code: 'EXPORT_ERROR'
                });
            }

            fastify.log.info('GDPR export-data success');
            return {
                success: true,
                data: exportData,
                format: 'json',
                generatedAt: new Date().toISOString()
            };
        } catch (error) {
            fastify.log.error('GDPR export error:', error);
            return reply.status(500).send({
                success: false,
                error: 'gdpr.exportError',
                code: 'EXPORT_ERROR',
                message: error.message
            });
        }
    });

    fastify.post('/delete-account', {
        preHandler: authenticateUser
    }, async (request, reply) => {
        try {
            fastify.log.info('GDPR delete-account request for user:', request.user?.id);

            const { confirmation } = request.body;
            const user = await findUserById(request.user.id);
            if (!user) {
                return reply.status(404).send({
                    success: false,
                    error: 'messages.userNotFound',
                    code: 'USER_NOT_FOUND'
                });
            }

            const confirmationText = 'DELETE MY ACCOUNT';
            if (!confirmation || confirmation !== confirmationText) {
                return reply.status(400).send({
                    success: false,
                    error: 'gdpr.invalidConfirmation',
                    code: 'CONFIRMATION_REQUIRED'
                });
            }

            const success = await gdprService.deleteUserAccount(user.id);
            if (!success) {
                return reply.status(500).send({
                    success: false,
                    error: 'gdpr.deletionError',
                    code: 'DELETION_ERROR'
                });
            }

            if (request.session?.destroy) {
                request.session.destroy();
            }

            fastify.log.info('GDPR delete-account success');
            return {
                success: true,
                message: 'messages.accountDeleted'
            };
        } catch (error) {
            fastify.log.error('GDPR delete-account error:', error);
            return reply.status(500).send({
                success: false,
                error: 'gdpr.deletionError',
                code: 'DELETION_ERROR',
                message: error.message
            });
        }
    });

    fastify.post('/update-consent', {
        preHandler: authenticateUser
    }, async (request, reply) => {
        try {
            fastify.log.info('GDPR update-consent request for user:', request.user?.id);
            fastify.log.info('Consent data:', request.body);

            const { marketingEmails, analytics, dataProcessing } = request.body;
            const user = await findUserById(request.user.id);
            if (!user) {
                return reply.status(404).send({
                    success: false,
                    error: 'messages.userNotFound',
                    code: 'USER_NOT_FOUND'
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
                    error: 'gdpr.consentUpdateError',
                    code: 'CONSENT_UPDATE_ERROR'
                });
            }

            fastify.log.info('GDPR update-consent success');
            return {
                success: true,
                message: 'messages.preferencesUpdated'
            };
        } catch (error) {
            fastify.log.error('GDPR update-consent error:', error);
            return reply.status(500).send({
                success: false,
                error: 'gdpr.consentUpdateError',
                code: 'CONSENT_UPDATE_ERROR',
                message: error.message
            });
        }
    });
}
