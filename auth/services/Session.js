import { databaseApiClient } from '../../shared/http-client.js';

export async function deleteUserSessions(userId) {
    try {
        const response = await databaseApiClient.deleteUserSessions(userId);
        return response.data.success;
    } catch (error) {
        console.error('Error deleting user sessions:', error);
        return false;
    }
}

export async function createUserSession(sessionData) {
    try {
        const response = await databaseApiClient.createSession(sessionData);
		console.log("ALERT 3");
        return response.data.success;
    } catch (error) {
        console.error('Error creating session:', error);
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
        console.error('Error getting user sessions:', error);
        return [];
    }
}
