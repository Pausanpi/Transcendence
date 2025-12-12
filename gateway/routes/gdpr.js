import gdprService from '../../database/services/gdpr.js';
import { authenticateJWT } from '../../auth/middleware/auth.js';
import findUserById from '../../users/models/User.js';
import fastifyStatic from '@fastify/static';
export default async function gdprRoutes(fastify, options) {
    fastify.addHook('preHandler', authenticateJWT);

    fastify.get('/management', async (request, reply) => {
        if (!request.isAuthenticated()) {
            return reply.redirect('/');
        }
        return reply.sendFile('auth/gdpr.html');
    });

    fastify.get('/user-data', async (request, reply) => {
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
            return reply.status(500).send({
                error: 'common.internalError',
                code: 'DATA_RETRIEVAL_ERROR'
            });
        }
    });

    fastify.post('/anonymize', async (request, reply) => {
        try {
            const user = await findUserById(request.user.id);
            if (!user) {
                return reply.status(404).send({
                    error: 'messages.userNotFound',
                    code: 'USER_NOT_FOUND'
                });
            }

            const success = await gdprService.anonymizeUserData(user.id);
            if (!success) {
                return reply.status(500).send({
                    error: 'gdpr.anonymizationError',
                    code: 'ANONYMIZATION_ERROR'
                });
            }

            if (request.session) {
                request.session.destroy();
            }

            return {
                success: true,
                message: 'messages.dataAnonymized'
            };
        } catch (error) {
            return reply.status(500).send({
                error: 'gdpr.anonymizationError',
                code: 'ANONYMIZATION_ERROR'
            });
        }
    });

    fastify.post('/export-data', async (request, reply) => {
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
            return reply.status(500).send({
                error: 'gdpr.exportError',
                code: 'EXPORT_ERROR'
            });
        }
    });

    fastify.post('/delete-account', async (request, reply) => {
        try {
            const { confirmation } = request.body;
            const confirmationText = request.session.language === 'es' ? 'ELIMINAR MI CUENTA' : 'DELETE MY ACCOUNT';

            if (!confirmation || confirmation !== confirmationText) {
                return reply.status(400).send({
                    error: 'gdpr.invalidConfirmation',
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

            const success = await gdprService.deleteUserAccount(user.id);
            if (!success) {
                return reply.status(500).send({
                    error: 'gdpr.deletionError',
                    code: 'DELETION_ERROR'
                });
            }

            if (request.session) {
                request.session.destroy();
            }

            return {
                success: true,
                message: 'messages.accountDeleted'
            };
        } catch (error) {
            return reply.status(500).send({
                error: 'gdpr.deletionError',
                code: 'DELETION_ERROR'
            });
        }
    });

    fastify.post('/update-consent', async (request, reply) => {
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
            return reply.status(500).send({
                error: 'gdpr.consentUpdateError',
                code: 'CONSENT_UPDATE_ERROR'
            });
        }
    });

    fastify.get('/user-consent', async (request, reply) => {
        try {
            const user = await findUserById(request.user.id);
            if (!user) {
                return reply.status(404).send({
                    error: 'messages.userNotFound',
                    code: 'USER_NOT_FOUND'
                });
            }

            const consent = {
                dataProcessing: user.consent_data_processing || true,
                marketingEmails: user.consent_marketing || false,
                analytics: user.consent_analytics || false
            };

            return {
                success: true,
                consent
            };
        } catch (error) {
            return reply.status(500).send({
                error: 'common.internalError',
                code: 'CONSENT_RETRIEVAL_ERROR'
            });
        }
    });
}
