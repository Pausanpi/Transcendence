import fastifyPassport from '@fastify/passport';
import jwtService from '../services/jwt.js';

import {
	saveUser,
	findUserById,
	findUserByEmail,
	incrementLoginAttempts,
	resetLoginAttempts,
	findOrCreateOAuthUser
} from '../../users/models/User.js';

import { validateLogin, validateRegistration } from '../middleware/validation.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fastifyStatic from '@fastify/static';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function authRoutes(fastify, options) {

	fastify.get('/github', {
		preValidation: fastifyPassport.authenticate('github', {
			scope: ['user:email']
		})
	}, async (request, reply) => reply.redirect('/')
	);


	fastify.get('/github/callback',
		{
			preValidation: fastifyPassport.authenticate('github', {
				failureRedirect: '/?error=auth_failed'
			})
		},
		async (request, reply) => {
			try {
				if (!request.user) {
					return reply.redirect('/?error=user_not_found');
				}

				const user = request.user;

				request.session.set('userId', user.id);
				request.session.set('user', {
					id: user.id,
					username: user.username,
					email: user.email,
					avatar: user.avatar || 'default-avatar.png'
				});

				if (user.two_factor_enabled === true) {
					request.session.set('pending2FAUserId', user.id);
					request.session.delete('twoFactorVerified');
					return reply.redirect('/auth/2fa-required');
				}

				const jwtToken = await jwtService.generateToken({
					id: user.id,
					username: user.username,
					email: user.email,
					twoFactorEnabled: false
				});

				request.session.set('jwtToken', jwtToken);
				request.session.delete('pending2FAUserId');

				reply.setCookie('auth_jwt', jwtToken, {
					path: '/',
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production',
					sameSite: 'lax',
					maxAge: 7 * 24 * 60 * 60
				});

				return reply.redirect('/auth/profile');
			} catch (error) {
				fastify.log.error('OAuth callback error:', error);
				return reply.redirect('/?error=process_failed');
			}
		}
	);

	fastify.get('/2fa-required', async (request, reply) => {
		if (!request.session.get('pending2FAUserId')) {
			return reply.redirect('/');
		}
		return reply.sendFile('auth/2fa-required.html');
	});

	fastify.get('/pending-2fa-user', async (request, reply) => {
		const pendingId = request.session.get('pending2FAUserId');
		if (!pendingId) return reply.status(404).send({ error: 'messages.userNotFound' });

		const user = await findUserById(pendingId);
		if (!user) return reply.status(404).send({ error: 'messages.userNotFound' });

		return {
			userId: pendingId,
			username: user.username,
			twoFactorEnabled: Boolean(user.two_factor_enabled)
		};
	});


	fastify.get('/profile', {
		preHandler: async (request, reply) => {
			if (!request.isAuthenticated || !request.isAuthenticated()) {
				return reply.redirect('/');
			}
			const user = await findUserById(request.user.id);
			if (!user) return reply.redirect('/');

			if (user.two_factor_enabled && !request.session.get('twoFactorVerified')) {
				request.session.set('pending2FAUserId', user.id);
				return reply.redirect('/auth/2fa-required');
			}
		}
	}, async (request, reply) => {
		return reply.sendFile('auth/profile.html');
	});

	fastify.get('/profile-data', async (request, reply) => {
		try {
			const userId = request.session?.get('userId') ||
				(request.user && request.user.id) ||
				request.headers['x-user-id'];

			if (!userId) {
				return reply.status(401).send({
					success: false,
					error: 'messages.authError'
				});
			}

			const user = await findUserById(userId);
			if (!user) {
				return reply.status(404).send({
					success: false,
					error: 'messages.userNotFound'
				});
			}

			const jwtToken = request.session?.get('jwtToken');

			return {
				success: true,
				id: user.id,
				username: user.username,
				email: user.email,
				avatar: user.avatar || 'default-avatar.png',
				twoFactorEnabled: Boolean(user.two_factor_enabled),
				jwtToken: jwtToken
			};
		} catch (error) {
			fastify.log.error('Error in profile-data:', error);
			return reply.status(500).send({
				success: false,
				error: 'common.internalError'
			});
		}
	});

	fastify.post('/login', { preHandler: validateLogin }, async (request, reply) => {
		const { email, password } = request.body;

		try {
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

				request.session.delete('userId');
				request.session.delete('user');
				request.session.delete('twoFactorVerified');

				request.session.set('pending2FAUserId', user.id);


				return reply.send({
					success: true,
					requires2FA: true,
					userId: user.id,
					username: user.username,
					message: '2FA verification required'
				});
			}


			request.session.delete('pending2FAUserId');

			request.session.set('userId', user.id);
			request.session.set('user', {
				id: user.id,
				username: user.username,
				email: user.email,
				avatar: user.avatar || 'default-avatar.png'
			});
			request.session.set('twoFactorVerified', false);

			const jwtToken = await jwtService.generateToken({
				id: user.id,
				username: user.username,
				email: user.email,
				twoFactorEnabled: false
			});

			request.session.set('jwtToken', jwtToken);

			reply.header('Set-Cookie', `auth_jwt=${jwtToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`);

			return reply.send({
				success: true,
				requires2FA: false,
				token: jwtToken,
				user: user.toSafeJSON()
			});

		} catch (error) {
			return reply.status(500).send({
				success: false,
				error: 'common.internalError'
			});
		}


	});

	fastify.post('/register', { preHandler: validateRegistration }, async (request, reply) => {
		const { username, email, password } = request.body;

		if (request.session) {
			try {
				await request.session.delete();
			} catch (e) {
			}
		}

		reply.clearCookie('auth_jwt', {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax'
		});

		reply.clearCookie('sessionId', {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax'
		});

		const existingUser = await findUserByEmail(email);
		if (existingUser) {
			return reply.status(400).send({ success: false, error: 'auth.userExists' });
		}

		const newUser = {
			id: 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
			username,
			email,
			password,
			oauthProvider: null,
			oauthId: null,
			two_factor_enabled: false,
			two_factor_secret: null,
			consent_marketing: 0,
			consent_analytics: 0,
			consent_data_processing: 1
		};

		const savedUser = await saveUser(newUser);
		if (!savedUser) {
			return reply.status(500).send({ success: false, error: 'auth.creationError' });
		}

		if (request.session && typeof request.session.set === 'function') {
			request.session.set('userId', savedUser.id);
			request.session.set('user', {
				id: savedUser.id,
				username: savedUser.username,
				email: savedUser.email,
				avatar: savedUser.avatar || 'default-avatar.png'
			});
			request.session.set('twoFactorVerified', false);
		}

		const jwtToken = await jwtService.generateToken({
			id: savedUser.id,
			username: savedUser.username,
			email: savedUser.email,
			twoFactorEnabled: false
		});

		if (request.session && typeof request.session.set === 'function') {
			request.session.set('jwtToken', jwtToken);
		}

		reply.setCookie('auth_jwt', jwtToken, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 7 * 24 * 60 * 60
		});

		return reply.send({
			success: true,
			requires2FA: false,
			token: jwtToken,
			user: savedUser.toSafeJSON()
		});
	});

	fastify.get('/logout', async (request, reply) => {
		request.session.delete();
		reply.clearCookie('sessionId');
		return reply.redirect('/');
	});

	fastify.get('/session-status', async (request, reply) => {
		return reply.send({
			isAuthenticated: request.isAuthenticated?.(),
			userId: request.session.get('userId'),
			user: request.session.get('user'),
			jwtToken: request.session.get('jwtToken'),
			cookies: request.headers.cookie
		});
	});

}
