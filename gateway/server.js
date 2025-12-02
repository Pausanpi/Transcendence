import Fastify from 'fastify';
import proxy from '@fastify/http-proxy';

const fastify = Fastify({ logger: true });

// Health check
fastify.get('/status', async () => ({ status: 'ok', service: 'gateway' }));

// Auth service proxy
await fastify.register(proxy, {
  upstream: 'http://auth:9200',
  prefix: '/api/auth',
  rewritePrefix: ''
});

// Users service proxy
await fastify.register(proxy, {
  upstream: 'http://users:9100',
  prefix: '/api/users',
  rewritePrefix: ''
});

// Backend service proxy - use explicit prefix
await fastify.register(proxy, {
  upstream: 'http://backend:9000',
  prefix: '/api/backend',
  rewritePrefix: ''
});

// Start
fastify.listen({ port: 8080, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log('API Gateway running on port 8080');
});