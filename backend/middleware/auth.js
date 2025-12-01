import jwtService from '../services/jwt.js';

export async function authenticateJWT(request, reply) {
	console.log('JWT Authentication check');

	if (request.isAuthenticated()) {
		console.log('User authenticated via session');
		return;
	}

	const authHeader = request.headers.authorization;
	console.log('Auth header:', authHeader);

	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		console.log('No Bearer token found');
		return reply.status(401).send({
			error: 'auth.invalidAuthFormat',
			code: 'INVALID_AUTH_FORMAT'
		});
	}

	const token = authHeader.substring(7).trim();
	console.log('Token received:', token.substring(0, 20) + '...');

	const decoded = await jwtService.verifyToken(token);
	console.log('Token verification result:', decoded ? 'valid' : 'invalid');

	if (!decoded) {
		return reply.status(401).send({
			error: 'auth.invalidToken',
			code: 'INVALID_TOKEN'
		});
	}

	request.user = decoded;
	console.log('JWT authentication successful for user:', decoded.id);
}
