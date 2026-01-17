
import fastifyPassport from '@fastify/passport';
import jwtService from '../../auth/services/jwt.js';
import { configurePassport } from '../../auth/config/oauth.js';
import { findOrCreateOAuthUser } from '../../auth/services/user.js';
export default async function gatewayRoutes(fastify, options) {


	fastify.get('/api/gateway/health', async () => ({
		service: 'api-gateway',
		status: 'OK',
		url: 'http://auth:3000',
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


	fastify.get('/api/auth/github',
		{ preValidation: fastifyPassport.authenticate('github', { scope: ['user:email'], session: false }) },
		async (req, reply) => { }
	);

	fastify.get('/api/auth/github/callback',
		{
			preValidation: fastifyPassport.authenticate('github', {
				failureRedirect: '/?error=auth_failed',
				session: false
			})
		},
		async (request, reply) => {
			const user = request.user;
			if (!user) return reply.redirect('/?error=user_not_found');

			const oauthProfile = {
				provider: 'github',
				id: user.id.toString(),
				username: user.username,
				email: user.email,
				avatar: user.avatar || 'default-avatar.png',
				profileUrl: user.profileUrl
			};

			const savedUser = await findOrCreateOAuthUser(oauthProfile);
			if (!savedUser) return reply.redirect('/?error=save_failed');

			const jwtToken = await jwtService.generateToken({
				id: savedUser.id,
				username: savedUser.username,
				email: savedUser.email,
				avatar: savedUser.avatar,
				twoFactorEnabled: savedUser.two_factor_enabled === true
			});

			return reply.redirect(`/?token=${jwtToken}`);
		});


}
