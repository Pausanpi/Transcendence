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
					avatar: user.avatar || 'default-avatar.png',
					profileUrl: user.profileUrl
				};

				const savedUser = await findOrCreateOAuthUser(oauthProfile);
				if (!savedUser) {
					return reply.redirect('/?error=save_failed');
				}

				await request.logIn(savedUser);

				if (savedUser.two_factor_enabled === true) {
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
		if (!request.session.pending2FAUserId) {
			return reply.redirect('/');
		}
		return reply.sendFile('auth/2fa-required.html');
	});

	fastify.get('/pending-2fa-user', async (request, reply) => {
		if (request.session.pending2FAUserId) {
			const user = await findUserById(request.session.pending2FAUserId);
			if (user) {
				return {
					userId: request.session.pending2FAUserId,
					username: user.username,
					twoFactorEnabled: Boolean(user.two_factor_enabled)
				};
			}
		}
		return reply.status(404).send({ error: 'messages.userNotFound' });
	});

	fastify.get('/profile', {
		preHandler: async (request, reply) => {
			if (!request.isAuthenticated || !request.isAuthenticated()) {
				return reply.redirect('/');
			}

			const user = await findUserById(request.user.id);
			if (!user) return reply.redirect('/');

			if (user.two_factor_enabled && !request.session.twoFactorVerified) {
				request.session.pending2FAUserId = user.id;
				return reply.redirect('/auth/2fa-required');
			}
		}
	}, async (request, reply) => {
		return reply.sendFile('auth/profile.html');
	});

	fastify.get('/profile-data', async (request, reply) => {
		if (!request.isAuthenticated || !request.isAuthenticated()) {
			return reply.status(401).send({ error: 'messages.authError' });
		}

		const user = await findUserById(request.user.id);
		if (!user) return reply.status(404).send({ error: 'messages.userNotFound' });

		return {
			id: user.id,
			username: user.username,
			email: user.email,
			avatar: user.avatar || 'default-avatar.png',
			twoFactorEnabled: Boolean(user.two_factor_enabled),
			jwtToken: request.session.jwtToken
		};
	});

	fastify.post('/login', {
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

		if (user.two_factor_enabled) {
			request.session.pending2FAUserId = user.id;
			delete request.session.twoFactorVerified;
			return {
				success: true,
				requires2FA: true,
				userId: user.id,
				username: user.username
			};
		}

		await request.logIn(user);
		const jwtToken = await jwtService.generateToken({
			id: user.id,
			username: user.username,
			email: user.email,
			twoFactorEnabled: false
		});

		request.session.jwtToken = jwtToken;
		request.session.twoFactorVerified = true;

		return {
			success: true,
			requires2FA: false,
			token: jwtToken,
			user: user.toSafeJSON()
		};
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
			id: 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
			username,
			email,
			password,
			oauthProvider: null,
			oauthId: null,
			two_factor_enabled: false,
			two_factor_secret: null
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
		request.session.twoFactorVerified = true;

		return { success: true, token: jwtToken };
	});

	fastify.get('/logout', async (request, reply) => {
		if (request.session) {
			request.session.destroy();
		}
		reply.clearCookie('sessionId');
		return reply.redirect('/');
	});
}
