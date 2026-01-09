import axios from 'axios';

class HttpClient {
	constructor(baseURL, options = {}) {
		this.client = axios.create({
			baseURL,
			timeout: options.timeout || 5000,
			headers: Object.assign({
				'Content-Type': 'application/json',
				'x-service-token': process.env.SERVICE_TOKEN || 'dev-service-token'
			}, options.headers || {})
		});
		this.client.interceptors.request.use(
			config => {
				return config;
			},
			error => {
				console.error('[HTTP Request Error]', error);
				return Promise.reject(error);
			}
		);
this.client.interceptors.response.use(
	response => {
		const contentType = response.headers['content-type'] || '';
		if (contentType.includes('application/json')) {
			return response;
		} else {
			return Object.assign({}, response, {
				data: {
					success: false,
					error: 'Invalid response format',
					raw: response.data
				}
			});
		}
	},
	error => {
		if (error.response && error.response.status === 404) {
			return Promise.resolve(error.response);
		}

		console.error('[HTTP Response Error]', {
			url: error.config?.url,
			method: error.config?.method,
			status: error.response?.status,
			message: error.message
		});

		if (error.response) {
			error.response.data = error.response.data || {
				success: false,
				error: 'Network error'
			};
		}
		return Promise.reject(error);
	}
);
	}
	async get(url, config = {}) {
		return this.client.get(url, config);
	}
	async post(url, data = {}, config = {}) {
		return this.client.post(url, data, config);
	}
	async put(url, data = {}, config = {}) {
		return this.client.put(url, data, config);
	}
	async delete(url, config = {}) {
		return this.client.delete(url, config);
	}
}

export const authClient = new HttpClient(
	process.env.AUTH_SERVICE_URL || 'http://localhost:3001'
);
export const i18nClient = new HttpClient(
	process.env.I18N_SERVICE_URL || 'http://localhost:3002'
);
export const databaseClient = new HttpClient(
	process.env.DATABASE_SERVICE_URL || 'http://localhost:3003'
);
export const usersClient = new HttpClient(
	process.env.USERS_SERVICE_URL || 'http://localhost:3004'
);

export const databaseApiClient = {
	getUserById: async (id) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.get(`/users/${id}`);
	},
	getUserByEmail: async (email) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.get(`/users/email/${encodeURIComponent(email)}`);
	},
	createUser: async (userData) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.post('/users', userData);
	},
	updateUser: async (id, updates) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.put(`/users/${id}`, updates);
	},
	deleteUser: async (id) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.delete(`/users/${id}`);
	},
	createSession: async (sessionData) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.post('/sessions', sessionData);
	},
	deleteUserSessions: async (userId) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.delete(`/sessions/user/${userId}`);
	},
	getUserSessions: async (userId) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.get(`/sessions/user/${userId}`);
	},
	saveBackupCodes: async (userId, codes) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.post('/backup-codes', { user_id: userId, codes });
	},
	getBackupCodes: async (userId) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://');
		return client.get(`/backup-codes/user/${userId}`);
	},

	updateLoginAttempts: async (userId, increment) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.put(`/users/${userId}/login-attempts`, { increment });
	},

	getAllUsers: async () => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.get('/users/all');
	},

	markCodeAsUsed: async (codeId) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.put(`/backup-codes/${codeId}/use`);
	},

	query: async (sql, params = [], type = 'all') => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.post('/query', { sql, params, type });
	},

	// ===== MATCHES =====
	createMatch: async (matchData) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.post('/matches', matchData);
	},

	getMatchById: async (id) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.get(`/matches/${id}`);
	},

	getUserMatches: async (userId, limit = 50, offset = 0) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.get(`/matches/user/${userId}?limit=${limit}&offset=${offset}`);
	},

	getTournamentMatches: async (tournamentId) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.get(`/matches/tournament/${tournamentId}`);
	},

	getAllMatches: async (gameType = null, limit = 100, offset = 0) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		const query = gameType ? `?game_type=${gameType}&limit=${limit}&offset=${offset}` : `?limit=${limit}&offset=${offset}`;
		return client.get(`/matches${query}`);
	},

	getUserStats: async (userId) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.get(`/stats/user/${userId}`);
	},

	// ===== TOURNAMENTS =====
	createTournament: async (tournamentData) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.post('/tournaments', tournamentData);
	},

	getTournamentById: async (id) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.get(`/tournaments/${id}`);
	},

	getAllTournaments: async (status = null, limit = 50, offset = 0) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		const query = status ? `?status=${status}&limit=${limit}&offset=${offset}` : `?limit=${limit}&offset=${offset}`;
		return client.get(`/tournaments${query}`);
	},

	updateTournament: async (id, updates) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.put(`/tournaments/${id}`, updates);
	},

	deleteTournament: async (id) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.delete(`/tournaments/${id}`);
	},

	addTournamentParticipant: async (tournamentId, participantData) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.post(`/tournaments/${tournamentId}/participants`, participantData);
	},

	getTournamentParticipants: async (tournamentId) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.get(`/tournaments/${tournamentId}/participants`);
	},

	updateTournamentParticipant: async (tournamentId, participantId, updates) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.put(`/tournaments/${tournamentId}/participants/${participantId}`, updates);
	},

	removeTournamentParticipant: async (tournamentId, participantId) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.delete(`/tournaments/${tournamentId}/participants/${participantId}`);
	},

	startTournament: async (tournamentId) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.post(`/tournaments/${tournamentId}/start`);
	},

	// ===== FRIENDS =====
	sendFriendRequest: async (userId, friendId) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.post('/friends', { user_id: userId, friend_id: friendId });
	},

	getUserFriends: async (userId, status = 'accepted') => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.get(`/friends/user/${userId}?status=${status}`);
	},

	getFriendRequests: async (userId) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.get(`/friends/requests/${userId}`);
	},

	getSentFriendRequests: async (userId) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.get(`/friends/sent/${userId}`);
	},

	updateFriendship: async (friendshipId, status) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.put(`/friends/${friendshipId}`, { status });
	},

	deleteFriendship: async (friendshipId) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.delete(`/friends/${friendshipId}`);
	},

	checkFriendship: async (userId, friendId) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.get(`/friends/check/${userId}/${friendId}`);
	},

	updateUserOnlineStatus: async (userId, onlineStatus) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.put(`/users/${userId}/status`, { online_status: onlineStatus });
	},

};
