import db from '../config/sqlite.js';
import passwordService from '../services/password.js';

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

export async function updateUser(userId, updateData) {
	try {
		const setClauses = [];
		const values = [];

		for (const [key, value] of Object.entries(updateData)) {
			setClauses.push(`${key} = ?`);
			values.push(value);
		}

		setClauses.push('updated_at = CURRENT_TIMESTAMP');
		const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`;
		values.push(userId);

		await db.run(sql, values);
		return await findUserById(userId);
	} catch (error) {
		console.error('Error updating user:', error);
		return null;
	}
}

export async function deleteUser(userId) {
	try {
		await db.run('DELETE FROM users WHERE id = ?', [userId]);
		return true;
	} catch (error) {
		console.error('Error deleting user:', error);
		return false;
	}
}

export async function anonymizeUser(userId) {
	try {
		const anonymizedUsername = `user_${Math.random().toString(36).substr(2, 9)}`;
		await db.run(
			`UPDATE users SET
                username = ?,
                email = NULL,
                avatar = NULL,
                two_factor_enabled = 0,
                two_factor_secret = NULL,
                is_anonymized = 1,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`,
			[anonymizedUsername, userId]
		);
		return await findUserById(userId);
	} catch (error) {
		console.error('Error anonymizing user:', error);
		return null;
	}
}

export async function findUserByEmail(email) {
	try {
		const row = await db.get('SELECT * FROM users WHERE email = ?', [email]);
		return row ? new User(row) : null;
	} catch (error) {
		return null;
	}
}

export async function findUserById(id) {
	try {
		const row = await db.get('SELECT * FROM users WHERE id = ?', [id]);
		return row ? new User(row) : null;
	} catch (error) {
		return null;
	}
}

export async function saveUser(userData) {
	try {
		let passwordHash = userData.password_hash;
		if (userData.password && !passwordHash) {
			passwordHash = await passwordService.hashPassword(userData.password);
		}

		const existingUser = await findUserById(userData.id);
		if (existingUser) {
			await db.run(
				`UPDATE users SET username = ?, email = ?, password_hash = ?, avatar = ?,
                 oauth_provider = ?, oauth_id = ?, two_factor_enabled = ?, two_factor_secret = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE id = ?`,
				[
					userData.username,
					userData.email,
					passwordHash,
					userData.avatar,
					userData.oauth_provider,
					userData.oauth_id,
					userData.two_factor_enabled ? 1 : 0,
					userData.two_factor_secret || null,
					userData.id
				]
			);
		} else {
			await db.run(
				`INSERT INTO users (id, username, email, password_hash, avatar, oauth_provider, oauth_id, two_factor_enabled, two_factor_secret)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					userData.id,
					userData.username,
					userData.email,
					passwordHash,
					userData.avatar,
					userData.oauth_provider,
					userData.oauth_id,
					userData.two_factor_enabled ? 1 : 0,
					userData.two_factor_secret || null
				]
			);
		}

		return await findUserById(userData.id);
	} catch (error) {
		return null;
	}
}

export async function findOrCreateOAuthUser(oauthProfile) {
	try {
		let user = await db.get(
			'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?',
			[oauthProfile.provider, oauthProfile.id]
		);

		if (user) return new User(user);

		const newUser = {
			id: oauthProfile.id,
			username: oauthProfile.username,
			email: oauthProfile.email,
			avatar: oauthProfile.avatar,
			oauth_provider: oauthProfile.provider,
			oauth_id: oauthProfile.id,
			two_factor_enabled: false,
			two_factor_secret: null
		};

		return await saveUser(newUser);
	} catch (error) {
		return null;
	}
}

export async function incrementLoginAttempts(userId) {
	try {
		await db.run(
			`UPDATE users SET login_attempts = login_attempts + 1 WHERE id = ?`,
			[userId]
		);
		return true;
	} catch (error) {
		return false;
	}
}

export async function resetLoginAttempts(userId) {
	try {
		await db.run(
			'UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?',
			[userId]
		);
		return true;
	} catch (error) {
		return false;
	}
}

export async function getAllUsers() {
	try {
		const users = await db.all('SELECT * FROM users ORDER BY created_at DESC');
		return users.map(row => new User(row));
	} catch (error) {
		return [];
	}
}

export function isUserAdmin(user) {
	return true;
}

export default User;
