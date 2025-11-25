import fastifyPassport from '@fastify/passport';
import jwtService from '../services/jwt.js';
import {
	saveUser,
	findUserById,
	findUserByEmail,
	incrementLoginAttempts,
	resetLoginAttempts,
	findOrCreateOAuthUser
} from '../models/User.js';
import { validateLogin, validateRegistration } from '../middleware/validation.js';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export default async function authRoutes(fastify, options) {
	fastify.get('/github', {
		preValidation: fastifyPassport.authenticate('github', {
			scope: ['user:email']
		})
	}, async (request, reply) => {
		return reply.redirect('/');
	});
	fastify.get('/github/callback',
		{
			preValidation: fastifyPassport.authenticate('github', {
				failureRedirect: '/?error=auth_failed'
			})
		},
		async (request, reply) => {
			const user = request.user;
			if (!user) {
				return reply.redirect('/?error=user_not_found');
			}
			try {
				const oauthProfile = {
					provider: 'github',
					id: user.id.toString(),
					username: user.username,
					email: user.email,
					avatar: user.avatar,
					profileUrl: user.profileUrl
				};
				const savedUser = await findOrCreateOAuthUser(oauthProfile);
				if (!savedUser) {
					return reply.redirect('/?error=save_failed');
				}
				await request.logIn(savedUser);
				if (savedUser.twoFactorEnabled === true) {
					request.session.pending2FAUserId = savedUser.id;
					delete request.session.twoFactorVerified;
					return reply.redirect('/auth/2fa-required');
				}
				const jwtToken = await jwtService.generateToken({
					id: savedUser.id,
					username: savedUser.username,
					email: savedUser.email,
					twoFactorEnabled: false
				});
				request.session.jwtToken = jwtToken;
				delete request.session.twoFactorVerified;
				delete request.session.pending2FAUserId;
				return reply.redirect('/auth/profile');
			} catch (error) {
				fastify.log.error('OAuth error:', error);
				return reply.redirect('/?error=process_failed');
			}
		}
	);
	fastify.get('/2fa-required', async (request, reply) => {
		return reply.sendFile('auth/2fa-required.html');
	});
	fastify.get('/pending-2fa-user', async (request, reply) => {
		if (request.session.pending2FAUserId) {
			return {
				userId: request.session.pending2FAUserId,
				sessionId: request.session.sessionId
			};
		}
		const userId = request.user?.id || request.session.userId;
		if (userId) {
			request.session.pending2FAUserId = userId;
			return {
				userId: userId,
				sessionId: request.session.sessionId
			};
		}
		return reply.status(404).send({
			error: 'messages.userNotFound',
			code: 'USER_NOT_FOUND'
		});
	});
	fastify.get('/profile', {
		preHandler: async (request, reply) => {
			if (!request.isAuthenticated()) {
				return reply.redirect('/');
			}
			const user = await findUserById(request.user.id);
			if (!user) {
				return reply.redirect('/');
			}
			if (user.twoFactorEnabled && !request.session.twoFactorVerified) {
				request.session.pending2FAUserId = user.id;
				return reply.redirect('/auth/2fa-required');
			}
		}
	}, async (request, reply) => {
		return reply.sendFile('auth/profile.html');
	});
	fastify.get('/profile-data', async (request, reply) => {
		if (!request.isAuthenticated()) {
			return reply.status(401).send({ error: 'messages.authError' });
		}
		const user = await findUserById(request.user.id);
		if (!user) {
			return reply.status(404).send({ error: 'messages.userNotFound' });
		}
		return {
			id: user.id,
			username: user.username,
			email: user.email,
			avatar: user.avatar,
			twoFactorEnabled: user.twoFactorEnabled || false,
			jwtToken: request.session.jwtToken
		};
	});
	fastify.post('/login', {
		schema: {
			body: {
				type: 'object',
				required: ['email', 'password'],
				properties: {
					email: { type: 'string', format: 'email' },
					password: { type: 'string', minLength: 8 }
				}
			}
		},
		preHandler: validateLogin
	}, async (request, reply) => {
		const { email, password } = request.body;
		const user = await findUserByEmail(email);
		if (!user) {
			return reply.status(401).send({
				success: false,
				error: 'messages.invalidCredentials'
			});
		}
		if (user.isAccountLocked()) {
			return reply.status(423).send({
				success: false,
				error: 'auth.accountLocked'
			});
		}
		const isValidPassword = await user.verifyPassword(password);
		if (!isValidPassword) {
			await incrementLoginAttempts(user.id);
			return reply.status(401).send({
				success: false,
				error: 'messages.invalidCredentials'
			});
		}
		await resetLoginAttempts(user.id);
		await request.logIn(user);
		if (user.twoFactorEnabled === true) {
			request.session.pending2FAUserId = user.id;
			delete request.session.twoFactorVerified;
			return {
				success: true,
				requires2FA: true,
				userId: user.id
			};
		}
		const jwtToken = await jwtService.generateToken({
			id: user.id,
			username: user.username,
			email: user.email,
			twoFactorEnabled: false
		});
		request.session.jwtToken = jwtToken;
		delete request.session.twoFactorVerified;
		delete request.session.pending2FAUserId;
		return {
			success: true,
			requires2FA: false,
			token: jwtToken,
			user: user.toSafeJSON()
		};
	});


fastify.setErrorHandler((error, request, reply) => {
    if (error.validation) {
        return reply.status(400).send({
            error: 'validation.invalidInput',
            code: 'VALIDATION_ERROR'
        });
    }
    reply.send(error);
});

	fastify.post('/register', {
		preHandler: validateRegistration
	}, async (request, reply) => {
		const { username, email, password } = request.body;
		const existingUser = await findUserByEmail(email);
		if (existingUser) {
			return reply.status(400).send({
				success: false,
				error: 'auth.userExists'
			});
		}
		const newUser = {
			id: generateUserId(),
			username,
			email,
			password,
			oauthProvider: null,
			oauthId: null
		};
		const savedUser = await saveUser(newUser);
		if (!savedUser) {
			return reply.status(500).send({
				success: false,
				error: 'auth.creationError'
			});
		}
		await request.logIn(savedUser);
		const jwtToken = await jwtService.generateToken({
			id: savedUser.id,
			username: savedUser.username,
			email: savedUser.email,
			twoFactorEnabled: false
		});
		request.session.jwtToken = jwtToken;
		return {
			success: true,
			token: jwtToken
		};
	});
	fastify.get('/logout', async (request, reply) => {
		request.session.destroy();
		reply.clearCookie('sessionId');
		return reply.redirect('/');
	});
}
function generateUserId() {
	return 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}
