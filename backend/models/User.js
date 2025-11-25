import db from '../config/sqlite.js';
import passwordService from '../services/password.js';

class User {
	constructor(userData) {
		this.id = userData.id;
		this.username = userData.username;
		this.email = userData.email;
		this.passwordHash = userData.password_hash;
		this.avatar = userData.avatar;
		this.profileUrl = userData.profile_url;
		this.oauthProvider = userData.oauth_provider;
		this.oauthId = userData.oauth_id;
		this.twoFactorEnabled = Boolean(userData.two_factor_enabled);
		this.twoFactorSecret = userData.two_factor_secret;
		this.backupCodes = userData.backup_codes ? JSON.parse(userData.backup_codes) : [];
		this.usedBackupCodes = userData.used_backup_codes ? JSON.parse(userData.used_backup_codes) : [];
		this.createdAt = userData.created_at;
		this.updatedAt = userData.updated_at;
		this.isActive = Boolean(userData.is_active);
		this.loginAttempts = userData.login_attempts || 0;
		this.lockedUntil = userData.locked_until;
		try {
			this.backupCodes = userData.backup_codes ?
				(typeof userData.backup_codes === 'string' ?
					JSON.parse(userData.backup_codes) :
					userData.backup_codes) :
				[];
		} catch (error) {
			console.error('Error parsing backup codes:', error);
			this.backupCodes = [];
		}
		try {
			this.usedBackupCodes = userData.used_backup_codes ?
				(typeof userData.used_backup_codes === 'string' ?
					JSON.parse(userData.used_backup_codes) :
					userData.used_backup_codes) :
				[];
		} catch (error) {
			console.error('Error parsing used backup codes:', error);
			this.usedBackupCodes = [];
		}
	}
	isOAuthUser() {
		return !!(this.oauthProvider && this.oauthId);
	}
	toJSON() {
		return {
			id: this.id,
			username: this.username,
			email: this.email,
			avatar: this.avatar,
			profileUrl: this.profileUrl,
			twoFactorEnabled: this.twoFactorEnabled,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
			isActive: this.isActive
		};
	}
	toSafeJSON() {
		const json = this.toJSON();
		delete json.twoFactorSecret;
		delete json.backupCodes;
		delete json.usedBackupCodes;
		delete json.passwordHash;
		return json;
	}
	async verifyPassword(password) {
		if (!this.passwordHash) return false;
		return await passwordService.verifyPassword(password, this.passwordHash);
	}
	isAccountLocked() {
		if (this.lockedUntil) {
			return new Date(this.lockedUntil) > new Date();
		}
		return false;
	}
}

function sanitizeInput(input) {
	if (typeof input !== 'string') return input;
	return input
		.replace(/[<>]/g, '')
		.replace(/javascript:/gi, '')
		.replace(/on\w+=/gi, '')
		.trim();
}

export async function findUserById(id) {
	try {
		const row = await db.get(
			'SELECT * FROM users WHERE id = ?',
			[id]
		);
		return row ? new User(row) : null;
	} catch (error) {
		console.error('Error searching for user:', error);
		return null;
	}
}

export async function findUserByGitHubId(githubId) {
	try {
		const row = await db.get(
			'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?',
			['github', githubId.toString()]
		);
		return row ? new User(row) : null;
	} catch (error) {
		console.error('Error searching for user by GitHub ID:', error);
		return null;
	}
}

export async function saveUser(userData) {
	try {
		const sanitizedData = {
			...userData,
			username: sanitizeInput(userData.username),
			email: sanitizeInput(userData.email).toLowerCase()
		};
		const twoFactorEnabled = sanitizedData.twoFactorEnabled ? 1 : 0;
		const isActive = sanitizedData.isActive !== undefined ? (sanitizedData.isActive ? 1 : 0) : 1;
		const existingUser = await findUserById(sanitizedData.id);
		if (existingUser) {
			await db.run(
				`UPDATE users
         SET username = ?, email = ?, password_hash = ?, avatar = ?, profile_url = ?,
             oauth_provider = ?, oauth_id = ?, two_factor_enabled = ?, is_active = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
				[
					sanitizedData.username,
					sanitizedData.email,
					sanitizedData.passwordHash || null,
					sanitizedData.avatar || null,
					sanitizedData.profileUrl || null,
					sanitizedData.oauthProvider || null,
					sanitizedData.oauthId || null,
					twoFactorEnabled,
					isActive,
					sanitizedData.id
				]
			);
			return await findUserById(sanitizedData.id);
		} else {
			let passwordHash = sanitizedData.passwordHash || null;
			if (sanitizedData.password && !passwordHash) {
				passwordHash = await passwordService.hashPassword(sanitizedData.password);
			}
			await db.run(
				`INSERT INTO users
         (id, username, email, password_hash, avatar, profile_url, oauth_provider, oauth_id, two_factor_enabled, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
				[
					sanitizedData.id,
					sanitizedData.username,
					sanitizedData.email,
					passwordHash,
					sanitizedData.avatar || null,
					sanitizedData.profileUrl || null,
					sanitizedData.oauthProvider || null,
					sanitizedData.oauthId || null,
					twoFactorEnabled,
					isActive
				]
			);
			return await findUserById(sanitizedData.id);
		}
	} catch (error) {
		console.error('Error saving/using user:', error);
		return null;
	}
}

export async function findOrCreateOAuthUser(oauthData) {
	try {
		const { provider, id, username, email, avatar, profileUrl } = oauthData;
		const existingOAuthUser = await findUserByOAuthId(provider, id);
		if (existingOAuthUser) {
			return existingOAuthUser;
		}
		if (email) {
			const existingEmailUser = await findUserByEmail(email);
			if (existingEmailUser) {
				return await updateUser(existingEmailUser.id, {
					oauthProvider: provider,
					oauthId: id.toString(),
					avatar: avatar,
					profileUrl: profileUrl
				});
			}
		}
		const newUser = {
			id: `github_${id}`,
			username: username || email.split('@')[0],
			email: email,
			oauthProvider: provider,
			oauthId: id.toString(),
			avatar: avatar,
			profileUrl: profileUrl,
			passwordHash: null
		};
		const savedUser = await saveUser(newUser);
		if (!savedUser) {
			throw new Error('No se pudo guardar el usuario OAuth');
		}
		return savedUser;
	} catch (error) {
		console.error('Error in findOrCreateOAuthUser:', error);
		throw error;
	}
}

export async function findUserByOAuthId(provider, oauthId) {
	try {
		const row = await db.get(
			'SELECT * FROM users WHERE oauth_provider = ? AND oauth_id = ?',
			[provider, oauthId.toString()]
		);
		return row ? new User(row) : null;
	} catch (error) {
		console.error('Error searching for user by OAuth ID:', error);
		return null;
	}
}

export async function updateUser(id, updates) {
	try {
		const sanitizedUpdates = { ...updates };
		if (sanitizedUpdates.username) {
			sanitizedUpdates.username = sanitizeInput(sanitizedUpdates.username);
		}
		if (sanitizedUpdates.email) {
			sanitizedUpdates.email = sanitizeInput(sanitizedUpdates.email).toLowerCase();
		}
		if (sanitizedUpdates.password) {
			sanitizedUpdates.password_hash = await passwordService.hashPassword(sanitizedUpdates.password);
			delete sanitizedUpdates.password;
		}
		const dbUpdates = {};
		Object.keys(sanitizedUpdates).forEach(key => {
			const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
			dbUpdates[dbKey] = sanitizedUpdates[key];
		});
		const setClause = Object.keys(dbUpdates)
			.map(key => `${key} = ?`)
			.join(', ');
		const values = Object.values(dbUpdates).map(value => {
			if (Array.isArray(value)) {
				return JSON.stringify(value);
			}
			if (typeof value === 'boolean') {
				return value ? 1 : 0;
			}
			return value;
		});
		values.push(id);
		await db.run(
			`UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
			values
		);
		return await findUserById(id);
	} catch (error) {
		console.error('Error updating user:', error);
		return null;
	}
}

export async function findUserByEmail(email) {
	try {
		const sanitizedEmail = sanitizeInput(email).toLowerCase();
		const row = await db.get(
			'SELECT * FROM users WHERE email = ?',
			[sanitizedEmail]
		);
		return row ? new User(row) : null;
	} catch (error) {
		console.error('Error searching for user by email:', error);
		return null;
	}
}

export async function incrementLoginAttempts(userId) {
	try {
		await db.run(
			`UPDATE users
       SET login_attempts = login_attempts + 1,
           locked_until = CASE WHEN login_attempts >= 4 THEN datetime('now', '+30 minutes') ELSE locked_until END
       WHERE id = ?`,
			[userId]
		);
		return true;
	} catch (error) {
		console.error('Error increasing login attempts:', error);
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
		console.error('Error resetting login attempts:', error);
		return false;
	}
}

export async function deleteUser(id) {
	try {
		await db.run('DELETE FROM users WHERE id = ?', [id]);
		return true;
	} catch (error) {
		console.error('Error deleting user:', error);
		return false;
	}
}

export async function anonymizeUser(id) {
	try {
		const anonymizedData = {
			username: `anon_${Math.random().toString(36).substr(2, 8)}`,
			email: null,
			avatar: null,
			profile_url: null,
			two_factor_enabled: 0,
			two_factor_secret: null,
			backup_codes: '[]',
			used_backup_codes: '[]'
		};
		await updateUser(id, anonymizedData);
		return true;
	} catch (error) {
		console.error('Error anonymizing user:', error);
		return false;
	}
}

export default User;
