import createFastifyApp from '../shared/fastify-config.js';
import adminRoutes from './routes/users.js';
import dotenv from 'dotenv';

dotenv.config();

async function startUserService() {
    const fastify = await createFastifyApp({
        serviceName: 'users-service',
        enableSessions: true,
        corsOrigin: process.env.CORS_ORIGIN || true
    });

    await fastify.register(adminRoutes, { prefix: '/users' });

    fastify.get('/health', async () => {
        return {
            service: 'users-service',
            status: 'OK',
            timestamp: new Date().toISOString(),
            endpoints: ['/users']
        };
    });

    const port = process.env.USERS_SERVICE_PORT || 3004;
    await fastify.listen({
        port: port,
        host: '0.0.0.0'
    });
    console.log(`👥 Users Service running on port ${port}`);
}

startUserService().catch(error => {
    console.error('Failed to start Users Service:', error);
    process.exit(1);
});
