import db from '../config/sqlite.js';

export async function createUserSession(sessionData) {
	try {
		await db.run(
			`INSERT INTO user_sessions (id, user_id, jwt_token, two_factor_verified, expires_at) VALUES (?, ?, ?, ?, ?)`,
			[
				sessionData.id,
				sessionData.userId,
				sessionData.jwtToken,
				sessionData.twoFactorVerified ? 1 : 0,
				sessionData.expiresAt
			]
		);
		return true;
	} catch (error) {
		console.error('Error creating session:', error);
		return false;
	}
}

export async function findSessionById(sessionId) {
	try {
		return await db.get(
			'SELECT * FROM user_sessions WHERE id = ?',
			[sessionId]
		);
	} catch (error) {
		console.error('Error searching for session:', error);
		return null;
	}
}

export async function updateSession(sessionId, updates) {
	try {
		const setClause = Object.keys(updates)
			.map(key => `${key} = ?`)
			.join(', ');
		const values = Object.values(updates);
		values.push(sessionId);
		await db.run(
			`UPDATE user_sessions SET ${setClause} WHERE id = ?`,
			values
		);
		return true;
	} catch (error) {
		console.error('Error updating session:', error);
		return false;
	}
}

export async function deleteSession(sessionId) {
	try {
		await db.run(
			'DELETE FROM user_sessions WHERE id = ?',
			[sessionId]
		);
		return true;
	} catch (error) {
		console.error('Error deleting session:', error);
		return false;
	}
}

export async function deleteUserSessions(userId) {
	try {
		await db.run('DELETE FROM user_sessions WHERE user_id = ?', [userId]);
		return true;
	} catch (error) {
		console.error('Error deleting sessions:', error);
		return false;
	}
}
