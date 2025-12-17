import jwtService from '../services/jwt.js';
import fastifyStatic from '@fastify/static';

export async function authenticateJWT(request, reply) {
    if (typeof request.isAuthenticated === 'function' && request.isAuthenticated()) {
        return;
    }

    let token;
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7).trim();
    }

    if (!token && request.headers.cookie) {
        const cookies = request.headers.cookie.split(';').map(c => c.trim());
        const authCookie = cookies.find(c => c.startsWith('auth_jwt='));
        if (authCookie) {
            token = authCookie.substring('auth_jwt='.length);
        }
    }

    if (!token) {
        return reply.status(401).send({
            error: 'auth.authenticationRequired',
            code: 'AUTHENTICATION_REQUIRED'
        });
    }

    const decoded = await jwtService.verifyToken(token);
    if (!decoded) {
        return reply.status(401).send({
            error: 'auth.invalidToken',
            code: 'INVALID_TOKEN'
        });
    }

    request.user = decoded;

    if (request.session && typeof request.session.set === 'function') {
        request.session.set('userId', decoded.id);
    }
}
