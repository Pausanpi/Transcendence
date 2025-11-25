
import { findUserById, updateUser, deleteUser } from '../models/User.js';
import { deleteUserSessions } from '../models/Session.js';
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
			const sessionCount = sessions[0]?.count || 0;
			return {
				profileInfo: {
					hasUsername: !!user.username,
					hasEmail: !!user.email,
					hasAvatar: !!user.avatar,
					twoFactorEnabled: user.twoFactorEnabled
				},
				activity: {
					sessionCount: sessionCount,
					accountCreated: user.createdAt,
					lastUpdated: user.updatedAt
				},
				dataCategories: [
					'Profile information',
					'Authentication preferences',
					'Session history',
					'2FA settings'
				]
			};
		} catch (error) {
			console.error('Error obtaining data summary:', error);
			return null;
		}
	}
	async anonymizeUserData(userId) {
		try {
			const anonymizedData = {
				username: `user_${this.generateRandomId()}`,
				email: null,
				avatar: null,
				profileUrl: null,
				twoFactorEnabled: false,
				twoFactorSecret: null,
				backupCodes: [],
				usedBackupCodes: [],
				isAnonymized: true,
				anonymizedAt: new Date().toISOString()
			};
			await updateUser(userId, anonymizedData);
			await deleteUserSessions(userId);
			return await findUserById(userId);
		} catch (error) {
			console.error('Error anonymizing user:', error);
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
			const exportData = {
				exportInfo: {
					generatedAt: new Date().toISOString(),
					format: 'GDPR-COMPLIANT',
					version: '1.0'
				},
				profile: user.toSafeJSON(),
				sessions: sessions.map(session => ({
					id: session.id,
					createdAt: session.created_at,
					expiresAt: session.expires_at,
					twoFactorVerified: session.two_factor_verified
				})),
				dataCategories: {
					personalInfo: ['username', 'email', 'avatar', 'profileUrl'],
					preferences: ['twoFactorEnabled', 'createdAt', 'updatedAt'],
					activity: ['sessions']
				}
			};
			return exportData;
		} catch (error) {
			console.error('Error exporting data:', error);
			throw error;
		}
	}
	async deleteUserAccount(userId) {
		try {
			await deleteUserSessions(userId);
			await deleteUser(userId);
			return true;
		} catch (error) {
			console.error('Error deleting account:', error);
			throw error;
		}
	}
	async updateUserConsent(userId, consentSettings) {
		try {
			await updateUser(userId, {
				gdprConsent: JSON.stringify(consentSettings)
			});
			return true;
		} catch (error) {
			console.error('Error updating consent:', error);
			throw error;
		}
	}
	generateRandomId() {
		return Math.random().toString(36).substr(2, 9);
	}
}

export default new GDPRService();
