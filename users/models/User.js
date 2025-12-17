import { databaseApiClient } from '../../shared/http-client.js';
import passwordService from '../../auth/services/password.js';

class User {
	constructor(data = {}) {
		this.id = data.id;
		this.username = data.username;
		this.email = data.email;
		this.password_hash = data.password_hash;
		this.oauth_provider = data.oauth_provider;
		this.oauth_id = data.oauth_id;
		this.avatar = data.avatar;
		this.two_factor_enabled = data.two_factor_enabled;
		this.two_factor_secret = data.two_factor_secret;
		this.is_active = data.is_active;
		this.is_anonymized = data.is_anonymized;
		this.login_attempts = data.login_attempts;
		this.locked_until = data.locked_until;
		this.created_at = data.created_at;
		this.updated_at = data.updated_at;
		this.consent_marketing = data.consent_marketing;
		this.consent_analytics = data.consent_analytics;
		this.consent_data_processing = data.consent_data_processing;
		this.consent_updated_at = data.consent_updated_at;
	}

	async verifyPassword(password) {
		return passwordService.verifyPassword(password, this.password_hash);
	}

	isAccountLocked() {
		if (this.locked_until) {
			return new Date(this.locked_until) > new Date();
		}
		return false;
	}

	toSafeJSON() {
		return {
			id: this.id,
			username: this.username,
			email: this.email,
			avatar: this.avatar,
			twoFactorEnabled: Boolean(this.two_factor_enabled),
			isActive: Boolean(this.is_active),
			isAnonymized: Boolean(this.is_anonymized),
			createdAt: this.created_at,
			updatedAt: this.updated_at
		};
	}
}

export async function findOrCreateOAuthUser(oauthProfile) {
	try {
		const existingUser = await findUserById(`oauth_${oauthProfile.provider}_${oauthProfile.id}`);

		if (existingUser) {
			return existingUser;
		}

		const newUser = {
			id: `oauth_${oauthProfile.provider}_${oauthProfile.id}`,
			username: oauthProfile.username,
			email: oauthProfile.email,
			password_hash: null,
			oauth_provider: oauthProfile.provider,
			oauth_id: oauthProfile.id,
			avatar: oauthProfile.avatar || 'default-avatar.png'
		};

		const response = await databaseApiClient.createUser(newUser);

		if (response.data.success) {
			return await findUserById(newUser.id);
		}
		return null;
	} catch (error) {
		console.error('Error in findOrCreateOAuthUser:', error);
		return null;
	}
}

export async function updateUser(userId, updateData) {
	try {
		const response = await databaseApiClient.updateUser(userId, updateData);
		if (response.data.success) {
			return await findUserById(userId);
		}
		return null;
	} catch (error) {
		console.error('Error updating user:', error);
		return null;
	}
}

export async function findUserByEmail(email) {
	try {
		const response = await databaseApiClient.getUserByEmail(email);
		if (response.status === 404) {
			return null;
		}
		if (response.data.success && response.data.user) {
			return new User(response.data.user);
		}
		return null;
	} catch (error) {
		if (error.response && error.response.status === 404) {
			return null;
		}
		console.error('Error finding user by email:', error);
		return null;
	}
}

export async function findUserById(id) {
	try {
		const response = await databaseApiClient.getUserById(id);
		if (response.data.success && response.data.user) {
			return new User(response.data.user);
		}
		return null;
	} catch (error) {
		console.error('Error finding user by id:', error);
		return null;
	}
}

export async function saveUser(userData) {
	try {
		let passwordHash = userData.password_hash;
		if (userData.password && !passwordHash) {
			passwordHash = await passwordService.hashPassword(userData.password);
		}

		const userToSave = {
			id: userData.id,
			username: userData.username,
			email: userData.email,
			password_hash: passwordHash,
			avatar: userData.avatar || 'default-avatar.png',
			oauth_provider: userData.oauth_provider || null,
			oauth_id: userData.oauth_id || null,
			two_factor_enabled: userData.two_factor_enabled ? 1 : 0,
			two_factor_secret: userData.two_factor_secret || null
		};

		const response = await databaseApiClient.createUser(userToSave);

		if (response.data.success) {
			return await findUserById(userData.id);
		}
		return null;
	} catch (error) {
		console.error('Error saving user:', error);
		return null;
	}
}

export async function getAllUsers() {
	try {
		const response = await databaseApiClient.getAllUsers();
		if (response.data.success) {
			return response.data.users.map(row => new User(row));
		}
		return [];
	} catch (error) {
		console.error('Error getting all users:', error);
		return [];
	}
}

export async function incrementLoginAttempts(userId) {
	try {
		const response = await databaseApiClient.updateLoginAttempts(userId, true);
		return response.data.success;
	} catch (error) {
		console.error('Error incrementing login attempts:', error);
		return false;
	}
}

export async function resetLoginAttempts(userId) {
	try {
		const response = await databaseApiClient.updateLoginAttempts(userId, false);
		return response.data.success;
	} catch (error) {
		console.error('Error resetting login attempts:', error);
		return false;
	}
}

export function isUserAdmin(user) {
	return user.email === 'admin@example.com' || user.id === 'admin';
}

export default User;
