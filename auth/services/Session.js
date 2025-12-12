import { databaseApiClient } from '../../shared/http-client.js';

export async function deleteUserSessions(userId) {
	try {
		const response = await databaseApiClient.deleteUserSessions(userId);
		return response.data.success;
	} catch (error) {
		return false;
	}
}

export async function createUserSession(sessionData) {
	try {
		const response = await databaseApiClient.createSession(sessionData);
		return response.data.success;
	} catch (error) {

		return false;
	}
}

export async function getUserSessions(userId) {
	try {
		const response = await databaseApiClient.getUserSessions(userId);
		if (response.data.success) {
			return response.data.sessions;
		}
		return [];
	} catch (error) {

		return [];
	}
}
