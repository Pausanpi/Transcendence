import { createFastifyApp } from './config/fastify.js';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import { findUserById } from './models/User.js';
import authRoutes from './routes/auth.js';
import twoFARoutes from './routes/2fa.js';
import gdprRoutes from './routes/gdpr.js';
import i18nRoutes from './routes/i18n.js';
import adminRoutes from './routes/admin.js';
dotenv.config();

async function start() {
	try {
		const fastify = await createFastifyApp();

		fastify.addHook('preHandler', async (request, reply) => {
			if (request.session.passport?.user) {
				const userId = request.session.passport.user;
				if (userId) {
					const user = await findUserById(userId);
					if (user) {
						request.user = user;
						request.isAuthenticated = () => true;
					}
				}
			}

			if (request.session.jwtToken && !request.user) {
				try {
					const jwtService = (await import('./services/jwt.js')).default;
					const decoded = await jwtService.verifyToken(request.session.jwtToken);
					if (decoded) {
						const user = await findUserById(decoded.id);
						if (user) {
							request.user = user;
							request.isAuthenticated = () => true;
						}
					}
				} catch (error) {
					console.error('JWT verification error in hook:', error);
					delete request.session.jwtToken;
				}
			}

			const publicRoutes = [
				'/', '/auth/login', '/auth/register', '/auth/github',
				'/auth/github/callback', '/auth/logout', '/health',
				'/i18n/translations', '/i18n/change-language',
				'/i18n/available-languages', '/locales/',
				'/css/', '/js/', '/game/', '/auth/2fa-required',
				'/2fa/verify-login'
			];

			const requiresAuth = !publicRoutes.some(route =>
				request.url.startsWith(route) ||
				request.url === route
			);

			if (requiresAuth && (!request.user || !request.isAuthenticated())) {
				if (request.url.startsWith('/api') || request.headers.accept?.includes('application/json')) {
					return reply.status(401).send({
						error: 'auth.authenticationRequired',
						code: 'AUTH_REQUIRED'
					});
				}
				return reply.redirect('/');
			}

			if (request.user && request.user.two_factor_enabled) {
				const twoFARoutes = ['/auth/profile', '/gdpr/', '/admin/', '/2fa/management'];
				const requires2FA = twoFARoutes.some(route =>
					request.url.startsWith(route) &&
					!request.url.includes('/2fa/verify-login') &&
					!request.url.includes('/auth/2fa-required')
				);

				if (requires2FA && !request.session.twoFactorVerified) {
					request.session.pending2FAUserId = request.user.id;

					if (request.headers.accept?.includes('application/json')) {
						return reply.status(403).send({
							error: '2fa.verificationRequired',
							code: '2FA_REQUIRED',
							requires2FA: true
						});
					}
					return reply.redirect('/auth/2fa-required');
				}
			}
		});

		await fastify.register(authRoutes, { prefix: '/auth' });
		await fastify.register(twoFARoutes, { prefix: '/2fa' });
		await fastify.register(gdprRoutes, { prefix: '/gdpr' });
		await fastify.register(i18nRoutes, { prefix: '/i18n' });
		await fastify.register(adminRoutes, { prefix: '/admin' });

		fastify.get('/health', async (request, reply) => {
			return { status: 'OK', timestamp: new Date().toISOString() };
		});

		fastify.get('/', async (request, reply) => {
			if (request.isAuthenticated && request.isAuthenticated()) {
				const user = request.user;
				if (user && user.two_factor_enabled && !request.session.twoFactorVerified) {
					request.session.pending2FAUserId = user.id;
					return reply.redirect('/auth/2fa-required');
				}
				return reply.sendFile('auth/profile.html');
			} else {
				return reply.sendFile('auth/login.html');
			}
		});

		fastify.setNotFoundHandler((request, reply) => {
			if (request.url.startsWith('/api/')) {
				return reply.status(404).send({
					error: 'Route not found',
					path: request.url,
					code: 'ROUTE_NOT_FOUND'
				});
			}

			const staticPaths = ['/css/', '/js/', '/images/', '/game/'];
			const isStatic = staticPaths.some(path => request.url.startsWith(path));

			if (isStatic) {
				return reply.status(404).send('File not found');
			}

			if (request.headers.accept?.includes('text/html')) {
				return reply.sendFile('auth/login.html');
			}

			reply.status(404).send({
				error: 'Route not found',
				path: request.url
			});
		});

		await fastify.listen({
			port: process.env.PORT || 3000,
			host: '0.0.0.0'
		});

		console.log(`Server running on port ${process.env.PORT || 3000}`);

	} catch (error) {
		console.error('Error starting server:', error);
		process.exit(1);
	}
}

process.on('SIGTERM', async () => {
	console.log('SIGTERM received, shutting down gracefully');
	process.exit(0);
});

process.on('SIGINT', async () => {
	console.log('SIGINT received, shutting down gracefully');
	process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
	console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
	console.error('Uncaught Exception:', error);
	process.exit(1);
});

start();
