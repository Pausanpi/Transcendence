import jwtService from '../services/jwt.js';
import fastifyStatic from '@fastify/static';
export async function authenticateJWT(request, reply) {
	if (typeof request.isAuthenticated === 'function' && request.isAuthenticated()) {
		return;
	}

	const authHeader = request.headers.authorization;

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return reply.status(401).send({
			error: 'auth.invalidAuthFormat',
			code: 'INVALID_AUTH_FORMAT'
		});
	}

	const token = authHeader.substring(7).trim();

	const decoded = await jwtService.verifyToken(token);

	if (!decoded) {
		return reply.status(401).send({
			error: 'auth.invalidToken',
			code: 'INVALID_TOKEN'
		});
	}

	request.user = decoded;
}
