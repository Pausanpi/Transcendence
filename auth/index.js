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

				return Promise.resolve();
			});
		}

		fastify.addHook('onReady', async () => {
			if (!fastify.hasRequestDecorator('isAuthenticated')) {
				fastify.decorateRequest('isAuthenticated', function () {
					try {
						const hasUserId = !!(this.session && typeof this.session.get === 'function' && this.session.get('userId'));
						if (hasUserId) return true;

						const cookieHeader = this.headers?.cookie;
						if (cookieHeader) {
							const match = cookieHeader.split(';').find(c => c.trim().startsWith('auth_jwt='));
							if (match) {
								const token = match.split('=')[1];
								if (token) {
									const decoded = jwtService.decodeToken(token);
									if (decoded?.id) {
										this.user = decoded;
										return true;
									}
								}
							}
						}
						if (this.user && this.user.id) {
							return true;
						}
						return false;
					} catch (e) {
						return false;
					}
				});
			}
		});
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
