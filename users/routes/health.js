export default async function healthRoutes(fastify, options) {
	fastify.get('/health', async () => {
		return {
			service: 'users-service',
			status: 'OK',
			timestamp: new Date().toISOString(),
			endpoints: ['/users']
		};
	});

	fastify.get('/users/health', async () => {
		return {
			service: 'users-service',
			status: 'OK',
			timestamp: new Date().toISOString(),
			endpoints: ['/users']
		};
	});

}
