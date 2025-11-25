import jwtService from '../services/jwt.js';
export async function authenticateJWT(request, reply) {
	if (request.isAuthenticated()) {
		return;
	}
	const authHeader = request.headers.authorization;
	if (!authHeader) {
		return reply.status(401).send({
			error: 'messages.authError',
			code: 'AUTH_REQUIRED'
		});
	}
	if (!authHeader.startsWith('Bearer ')) {
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
