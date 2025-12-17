import { databaseApiClient } from '../../shared/http-client.js';
import { findUserById } from '../../users/models/User.js';

class GdprService {
	async getUserDataSummary(userId) {
		try {
			const user = await findUserById(userId);
			if (!user) return null;
			const sessionsResponse = await databaseApiClient.getUserSessions(userId);
			const sessions = sessionsResponse.data.success ? sessionsResponse.data.sessions : [];
			return {
				profileInfo: {
					hasUsername: !!user.username,
					hasEmail: !!user.email,
					hasAvatar: !!user.avatar,
					twoFactorEnabled: Boolean(user.two_factor_enabled)
				},
				activity: {
					sessionCount: sessions.length,
					accountCreated: user.created_at || new Date().toISOString(),
					lastUpdated: user.updated_at || new Date().toISOString()
				},
				consent: {
					marketingEmails: user.consent_marketing === 1,
					analytics: user.consent_analytics === 1,
					dataProcessing: user.consent_data_processing === 1,
					updatedAt: user.consent_updated_at
				}
			};
		} catch (error) {
			console.error('Error in getUserDataSummary:', error);
			return null;
		}
	}

	async anonymizeUserData(userId) {
		try {
			await databaseApiClient.deleteUserSessions(userId);
			const anonymizedData = {
				username: `anonymous_${this.generateRandomId()}`,
				email: null,
				avatar: null,
				is_anonymized: 1,
				two_factor_enabled: 0,
				two_factor_secret: null
			};
			const response = await databaseApiClient.updateUser(userId, anonymizedData);
			return response.data.success;
		} catch (error) {
			console.error('Error in anonymizeUserData:', error);
			throw error;
		}
	}

	async exportUserData(userId) {
		try {
			const user = await findUserById(userId);
			if (!user) return null;
			const sessionsResponse = await databaseApiClient.getUserSessions(userId);
			const sessions = sessionsResponse.data.success ? sessionsResponse.data.sessions : [];
			return {
				exportInfo: {
					generatedAt: new Date().toISOString(),
					format: 'GDPR-COMPLIANT'
				},
				profile: user.toSafeJSON(),
				sessions: sessions.map(session => ({
					id: session.id,
					createdAt: session.created_at,
					expiresAt: session.expires_at
				}))
			};
		} catch (error) {
			console.error('Error in exportUserData:', error);
			throw error;
		}
	}

	async updateUserConsent(userId, consentData) {
		try {
			const response = await databaseApiClient.updateUser(userId, {
				consent_marketing: consentData.marketingEmails ? 1 : 0,
				consent_analytics: consentData.analytics ? 1 : 0,
				consent_data_processing: consentData.dataProcessing ? 1 : 0,
				consent_updated_at: consentData.consentUpdatedAt
			});
			return response.data.success;
		} catch (error) {
			console.error('Error in updateUserConsent:', error);
			throw error;
		}
	}

	async deleteUserAccount(userId) {
		try {
			await databaseApiClient.deleteUserSessions(userId);
			await databaseApiClient.saveBackupCodes(userId, []);
			const response = await databaseApiClient.deleteUser(userId);
			return response.data.success;
		} catch (error) {
			console.error('Error in deleteUserAccount:', error);
			throw error;
		}
	}

	generateRandomId() {
		return Math.random().toString(36).substr(2, 9);
	}
}

const gdprServiceInstance = new GdprService();

export const anonymizeUserData = (userId) => gdprServiceInstance.anonymizeUserData(userId);
export const deleteUserAccount = (userId) => gdprServiceInstance.deleteUserAccount(userId);
export const updateUserConsent = (userId, consentData) => gdprServiceInstance.updateUserConsent(userId, consentData);
export const exportUserData = (userId) => gdprServiceInstance.exportUserData(userId);
export const getUserDataSummary = (userId) => gdprServiceInstance.getUserDataSummary(userId);

export default gdprServiceInstance;
