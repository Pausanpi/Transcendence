import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyFormbody from '@fastify/formbody';
import fastifyCookie from '@fastify/cookie';
import fastifySession from '@fastify/session';
import fastifyCors from '@fastify/cors';
import fastifyPassport from './oauth.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function createFastifyApp() {
	const fastify = Fastify({
		logger: {
			level: process.env.LOG_LEVEL || 'info'
		},
		trustProxy: true
	});

	await fastify.register(fastifyCors, {
		origin: true,
		credentials: true
	});

	await fastify.register(fastifyFormbody);
	await fastify.register(fastifyCookie);

	await fastify.register(fastifySession, {
		secret: process.env.SESSION_SECRET || 'fallback-secret-change-in-prod',
		cookieName: 'sessionId',
		cookie: {
			secure: process.env.NODE_ENV === 'production',
			httpOnly: true,
			sameSite: 'lax',
			maxAge: 3600000
		},
		saveUninitialized: false
	});

	await fastify.register(fastifyPassport.initialize());
	await fastify.register(fastifyPassport.secureSession());

	await fastify.register(fastifyStatic, {
		root: path.join(process.cwd(), 'frontend'),
		prefix: '/'
	});

	fastify.addHook('onRequest', async (request, reply) => {
		reply.header('X-Powered-By', 'Secured Application');
		reply.header('Strict-Transport-Security', 'max-age=31536000');
		reply.header('X-Content-Type-Options', 'nosniff');
		reply.header('X-Frame-Options', 'DENY');
		reply.header('X-XSS-Protection', '1; mode=block');
		reply.header('Referrer-Policy', 'strict-origin-when-cross-origin');
		reply.header('Cache-Control', 'no-store, no-cache, must-revalidate');
		reply.header('Pragma', 'no-cache');
	});

	return fastify;
}
