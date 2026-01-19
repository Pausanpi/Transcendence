
import fastifyPassport from '@fastify/passport';
import jwtService from '../../auth/services/jwt.js';
import { configurePassport } from '../../auth/config/oauth.js';
import { findOrCreateOAuthUser } from '../../auth/services/user.js';
export default async function gatewayRoutes(fastify, options) {


	fastify.get('/health', async () => ({
		service: 'api-gateway',
		status: 'OK',
		url: 'http://gateway:3000',
		database: 'connected',
		timestamp: new Date().toISOString(),
		endpoints: [
			'/api/auth',
			'/api/2fa',
			'/api/i18n',
			'/api/users',
			'/api/database',
			'/api/gdpr'
		]
	}));




}
