import { createFastifyApp } from './config/fastify.js';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import { findUserById } from './models/User.js';
import authRoutes from './routes/auth.js';
import twoFARoutes from './routes/2fa.js';
import gdprRoutes from './routes/gdpr.js';
import i18nRoutes from './routes/i18n.js';
import fs from 'fs';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;

async function start() {
  try {
    const fastify = await createFastifyApp();
    if (!fastify.hasRequestDecorator('user')) {
      fastify.decorateRequest('user', null);
    }
    if (!fastify.hasRequestDecorator('isAuthenticated')) {
      fastify.decorateRequest('isAuthenticated', function() {
        return !!this.session.passport?.user;
      });
    }
    fastify.addHook('onRequest', async (request, reply) => {
      fastify.log.info({
        method: request.method,
        url: request.url,
        ip: request.ip,
        userAgent: request.headers['user-agent']
      });
    });
    fastify.addHook('preHandler', async (request, reply) => {
      if (request.session.passport?.user) {
        const userId = request.session.passport.user.id || request.session.passport.user;
        if (userId) {
          const user = await findUserById(userId);
          if (user) {
            request.user = user;
          }
        }
      }
    });
    await fastify.register(authRoutes, { prefix: '/auth' });
    await fastify.register(twoFARoutes, { prefix: '/2fa' });
    await fastify.register(gdprRoutes, { prefix: '/gdpr' });
    await fastify.register(i18nRoutes, { prefix: '/i18n' });


fastify.get('/health', async (request, reply) => {
  return {
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'web-app'
  }
});
    fastify.get('/', async (request, reply) => {
      if (request.isAuthenticated()) {
        const user = request.user;
        if (user && user.twoFactorEnabled && !request.session.twoFactorVerified) {
          request.session.pending2FAUserId = user.id;
          return reply.redirect('/auth/2fa-required');
        }
        return reply.sendFile('auth/profile.html');
      } else {
        return reply.sendFile('auth/login.html');
      }
    });
    fastify.setNotFoundHandler((request, reply) => {
      reply.status(404).send({
        error: 'Route not found',
        path: request.url
      });
    });
    fastify.setErrorHandler((error, request, reply) => {
      fastify.log.error(error);
      reply.status(error.statusCode || 500).send({
        error: error.message || 'Internal Server Error',
        statusCode: error.statusCode || 500
      });
    });
    await fastify.listen({
      port: process.env.PORT || 3000,
      host: '0.0.0.0'
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  process.exit(0);
});

process.on('SIGINT', async () => {
  process.exit(0);
});

start();
