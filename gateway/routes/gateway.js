import jwt from 'jsonwebtoken';

const SERVICE_TOKEN = process.env.SERVICE_TOKEN || 'dev-service-token';

export default async function gatewayRoutes(fastify, options) {
    const jwtSecret = process.env.JWT_SECRET || 'dev-fallback-secret';

    fastify.get('/', async (request, reply) => {
        try {
            const cookieHeader = request.headers && request.headers.cookie;
            if (cookieHeader && typeof cookieHeader === 'string') {
                const match = cookieHeader.split(';').find(c => c.trim().startsWith('auth_jwt='));
                if (match) {
                    const token = match.split('=')[1];
                    if (token) {
                        try {
                            const decoded = jwt.verify(token, jwtSecret, { issuer: 'gateway', audience: 'user' });
                            if (decoded) return reply.redirect('/auth/profile');
                        } catch (e) {
                        }
                    }
                }
            }
        } catch (e) {
        }

        return reply.sendFile('auth/login.html');
    });

    fastify.get('/health', async () => ({
        gateway: 'OK',
        timestamp: new Date().toISOString(),
        endpoints: [
            '/auth',
            '/2fa',
            '/i18n',
            '/users',
            '/auth/login',
            '/auth/profile',
            '/2fa/management',
            '/gdpr/management'
        ]
    }));

    fastify.get('/auth/login', async (request, reply) => reply.sendFile('auth/login.html'));

    fastify.get('/auth/profile', async (request, reply) => {
        if (!request.isAuthenticated?.()) return reply.redirect('/auth/login');
        return reply.sendFile('auth/profile.html');
    });

    fastify.get('/auth/2fa-required', async (request, reply) => reply.sendFile('auth/2fa-required.html'));

    fastify.get('/2fa/management', async (request, reply) => {
        if (!request.isAuthenticated?.()) return reply.redirect('/auth/login');
        return reply.sendFile('auth/2fa-management.html');
    });

    fastify.get('/gdpr/management', async (request, reply) => {
        if (!request.isAuthenticated?.()) return reply.redirect('/auth/login');
        return reply.sendFile('auth/gdpr.html');
    });

    fastify.get('/users/users.html', async (request, reply) => {
        if (!request.isAuthenticated?.()) return reply.redirect('/auth/login');
        return reply.sendFile('users/users.html');
    });

    fastify.get('/users/decode.html', async (request, reply) => reply.sendFile('users/decode.html'));

    fastify.get('/ready', async () => {
        try {
            const databaseUrl = process.env.DATABASE_SERVICE_URL || 'http://localhost:3003';
            const response = await fetch(`${databaseUrl}/health`);
            const data = await response.json();
            return { status: 'ready', database: data.status === 'OK' ? 'connected' : 'error' };
        } catch (error) {
            return { status: 'not-ready', database: 'error', error: error && error.message };
        }
    });

    fastify.get('/auth/profile-data', async (request, reply) => {
        const isAuthenticated = request.isAuthenticated?.();

        if (!isAuthenticated || !request.user || !request.user.id) {
            return reply.status(401).send({ error: 'messages.authError', code: 'AUTH_REQUIRED' });
        }

        const upstream = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
        const url = `${upstream}/auth/profile-data`;

        try {
            const headers = {
                'x-service-token': SERVICE_TOKEN,
                'x-forwarded-for': request.headers['x-forwarded-for'] || '',
                'x-user-id': request.user.id,
                'x-user': JSON.stringify(request.user),
                'cookie': request.headers.cookie || ''
            };

            const response = await fetch(url, { headers });
            const data = await response.json();

            reply.code(response.status);
            return reply.send(data);
        } catch (error) {
            return reply.status(502).send({ error: 'Service unavailable', code: 'SERVICE_ERROR' });
        }
    });
}
