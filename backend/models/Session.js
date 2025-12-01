import db from '../config/sqlite.js';

export async function deleteUserSessions(userId) {
	try {
		await db.run('DELETE FROM user_sessions WHERE user_id = ?', [userId]);
		return true;
	} catch (error) {
		return false;
	}
}

export async function createUserSession(sessionData) {
	try {
		await db.run(
			`INSERT INTO user_sessions (id, user_id, jwt_token, expires_at) VALUES (?, ?, ?, ?)`,
			[sessionData.id, sessionData.userId, sessionData.jwtToken, sessionData.expiresAt]
		);
		return true;
	} catch (error) {
		return false;
	}
}
