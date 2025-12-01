
import { deleteUserSessions } from '../models/Session.js';
import { findUserById, updateUser, deleteUser, anonymizeUser } from '../models/User.js';
import db from '../config/sqlite.js';

class GDPRService {
	async getUserDataSummary(userId) {
		try {
			const user = await findUserById(userId);
			if (!user) return null;

			const sessions = await db.all(
				'SELECT COUNT(*) as count FROM user_sessions WHERE user_id = ?',
				[userId]
			);

			return {
				profileInfo: {
					hasUsername: !!user.username,
					hasEmail: !!user.email,
					hasAvatar: !!user.avatar,
					twoFactorEnabled: user.two_factor_enabled
				},
				activity: {
					sessionCount: sessions[0]?.count || 0,
					accountCreated: user.created_at,
					lastUpdated: user.updated_at
				}
			};
		} catch (error) {
			return null;
		}
	}
	async anonymizeUserData(userId) {
		try {
			const anonymizedUser = await anonymizeUser(userId);
			await deleteUserSessions(userId);
			return anonymizedUser;
		} catch (error) {
			console.error('Error in anonymizeUserData:', error);
			throw error;
		}
	}

	async exportUserData(userId) {
		try {
			const user = await findUserById(userId);
			if (!user) return null;

			const sessions = await db.all(
				'SELECT * FROM user_sessions WHERE user_id = ?',
				[userId]
			);

			return {
				exportInfo: {
					generatedAt: new Date().toISOString(),
					format: 'GDPR-COMPLIANT'
				},
				profile: user.toSafeJSON(),
				sessions: sessions.map(session => ({
					id: session.id,
					createdAt: session.created_at
				}))
			};
		} catch (error) {
			throw error;
		}
	}

	async updateUserConsent(userId, consentData) {
		try {
			await db.run(
				`UPDATE users SET
                    consent_marketing = ?,
                    consent_analytics = ?,
                    consent_data_processing = ?,
                    consent_updated_at = ?,
                    updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
				[
					consentData.marketingEmails ? 1 : 0,
					consentData.analytics ? 1 : 0,
					consentData.dataProcessing ? 1 : 0,
					consentData.consentUpdatedAt,
					userId
				]
			);
			return true;
		} catch (error) {
			console.error('Error updating user consent:', error);
			throw error;
		}
	}

	async deleteUserAccount(userId) {
		try {
			await deleteUserSessions(userId);
			const success = await deleteUser(userId);
			if (!success) {
				throw new Error('Failed to delete user');
			}
			return true;
		} catch (error) {
			console.error('Error in deleteUserAccount:', error);
			throw error;
		}
	}

	generateRandomId() {
		return Math.random().toString(36).substr(2, 9);
	}
}


export default new GDPRService();
