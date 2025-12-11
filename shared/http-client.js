import axios from 'axios';

class HttpClient {
	constructor(baseURL, options = {}) {
		this.client = axios.create({
			baseURL,
			timeout: options.timeout || 5000,
			withCredentials: true,
			headers: {
				'Content-Type': 'application/json',
				'x-service-token': process.env.SERVICE_TOKEN || 'dev-service-token',
				...options.headers
			}
		});

		this.client.interceptors.request.use(
			config => {
				console.log(`[HTTP Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
				return config;
			},
			error => {
				console.error('[HTTP Request Error]', error);
				return Promise.reject(error);
			}
		);

		this.client.interceptors.response.use(
			response => response,
			error => {
				console.error('[HTTP Response Error]', {
					url: error.config?.url,
					method: error.config?.method,
					status: error.response?.status,
					message: error.message
				});
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
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.get(`/backup-codes/user/${userId}`);
	},

	markCodeAsUsed: async (codeId) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.put(`/backup-codes/${codeId}/use`);
	},

	getAllUsers: async () => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.get('/users/all');
	},

	updateLoginAttempts: async (userId, increment) => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.put(`/users/${userId}/login-attempts`, { increment });
	},

	query: async (sql, params = [], type = 'all') => {
		const client = new HttpClient(process.env.DATABASE_SERVICE_URL || 'http://localhost:3003');
		return client.post('/query', { sql, params, type });
	}
};

export default HttpClient;
