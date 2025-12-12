import Fastify from 'fastify';
import authRoutes from './routes/auth.js';
import twoFARoutes from './routes/2fa.js';
import healthRoutes from './routes/health.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fastifyStatic from '@fastify/static';
import jwtService from './services/jwt.js';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function startAuthService() {
	const loggerConfig = {
		level: process.env.LOG_LEVEL || 'info'
	};

	if (process.env.NODE_ENV === 'development') {
		try {
			await import('pino-pretty');
			loggerConfig.transport = {
				target: 'pino-pretty',
				options: {
					colorize: true,
					translateTime: 'HH:MM:ss Z',
					ignore: 'pid,hostname'
				}
			};
		} catch {
		}
	}

	const fastify = Fastify({
		logger: loggerConfig,
		trustProxy: true
	});

	const fastifyCors = await import('@fastify/cors');
	await fastify.register(fastifyCors.default, {
		origin: process.env.CORS_ORIGIN || true,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization', 'x-service-token', 'Cookie', 'x-forwarded-for'],
		exposedHeaders: ['Set-Cookie', 'Authorization']
	});
	const fastifyFormbody = await import('@fastify/formbody');
	await fastify.register(fastifyFormbody.default);

	const fastifySecureSession = await import('@fastify/secure-session');
	const sessionSecret = process.env.SESSION_SECRET;
	let sessionKey;
	if (sessionSecret && sessionSecret.length >= 64) {
		sessionKey = Buffer.from(sessionSecret, 'hex');
	} else {
		sessionKey = crypto.randomBytes(32);
	}

	await fastify.register(fastifySecureSession.default, {
		key: sessionKey,
		cookie: {
			path: '/',
			secure: process.env.NODE_ENV === 'production',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 7 * 24 * 60 * 60
		},
		cookieName: 'sessionId',
		sessionName: 'session'
	});

	const fastifyPassport = await import('@fastify/passport');
	const { configurePassport } = await import('./config/oauth.js');

	await fastify.register(fastifyPassport.default.initialize());
	await fastify.register(fastifyPassport.default.secureSession());

	configurePassport(fastifyPassport.default);

	fastify.addHook('onReady', async () => {
		if (!fastify.hasRequestDecorator('logIn')) {
			fastify.decorateRequest('logIn', function (user) {
				this.session.set('userId', user.id);
				this.session.set('user', {
					id: user.id,
					username: user.username,
					email: user.email,
					avatar: user.avatar || 'default-avatar.png'
				});
				this.session.set('twoFactorVerified', false);
				try {
					if (this.session && typeof this.session.keys === 'function') {
					}
				} catch (e) {
				}
				return Promise.resolve();
			});
		}

		if (!fastify.hasRequestDecorator('isAuthenticated')) {
			fastify.decorateRequest('isAuthenticated', function () {
				try {
					try {
						const headerUser = this.headers && (this.headers['x-user'] || this.headers['x-user-id']);
						if (headerUser) {
							if (this.headers['x-user']) {
								try { this.user = JSON.parse(this.headers['x-user']); } catch (e) { this.user = { id: this.headers['x-user-id'] || null }; }
							} else {
								this.user = { id: this.headers['x-user-id'] };
							}
							return true;
						}
					} catch (e) { }

					const hasUserId = !!(this.session && typeof this.session.get === 'function' && this.session.get('userId'));
					if (hasUserId) return true;

					try {
						const cookieHeader = this.headers && this.headers.cookie;
						if (cookieHeader && typeof cookieHeader === 'string') {
							const match = cookieHeader.split(';').map(s => s.trim()).find(s => s.startsWith('auth_jwt='));
							if (match) {
								const idx = match.indexOf('=');
								const token = idx === -1 ? '' : match.slice(idx + 1);
								const decoded = jwtService.decodeToken(token);
								if (decoded && decoded.id) {
									this.user = decoded;
									return true;
								}
							}
						}
					} catch (e) {
					}

					return false;
				} catch (e) {
					return false;
				}
			});
		}
	});

	fastify.setErrorHandler(function (error, request, reply) {
		fastify.log.error({ err: error, url: request.url, method: request.method }, 'Request error');
		const statusCode = error.statusCode || 500;
		const response = { error: 'common.internalError', code: 'INTERNAL_ERROR' };
		if (error.validation) {
			reply.status(400);
			response.error = 'validation.invalidInput';
			response.code = 'VALIDATION_ERROR';
			response.details = error.validation;
		}
		if (process.env.NODE_ENV === 'development') response.message = error.message;
		reply.status(statusCode).send(response);
	});

	fastify.setNotFoundHandler((request, reply) => {
		reply.status(404).send({ error: 'Route not found', path: request.url, code: 'ROUTE_NOT_FOUND' });
	});

	await fastify.register(fastifyStatic, {
		root: path.join(__dirname, '../frontend'),
		prefix: '/',
	});

	await fastify.register(authRoutes, { prefix: '/auth' });
	await fastify.register(twoFARoutes, { prefix: '/2fa' });
	await fastify.register(healthRoutes);

	const port = process.env.AUTH_SERVICE_PORT || 3001;
	await fastify.listen({ port, host: '0.0.0.0' });
}

startAuthService().catch(error => {
	process.exit(1);
});

process.on('unhandledRejection', (err) => {
	process.exit(1);
});

process.on('uncaughtException', (err) => {
	process.exit(1);
});
