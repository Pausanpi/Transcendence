export default async function healthRoutes(fastify, options) {
	fastify.get('/database/health', async () => {
		try {
			return {
				service: 'database-service',
				status: 'OK',
				url: process.env.DATABASE_SERVICE_PORT,
				database: 'connected',
				timestamp: new Date().toISOString(),
				endpoints: [
					'/users/:id',
					'/users/email/:email',
					'/users',
					'/users/all',
					'/sessions',
					'/backup-codes',
					'/query'
				]
			};
		} catch (error) {
			return {
				service: 'database-service',
				status: 'ERROR',
				database: 'disconnected',
				success: false,
				error: error.message,
				timestamp: new Date().toISOString()
			};
		}
	});

	
}


