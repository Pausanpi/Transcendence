import Fastify from 'fastify';

const fastify = Fastify({ logger: true });

// Health check
fastify.get('/status', async () => ({ status: 'ok', service: 'backend' }));

// Placeholder - will add tournaments, matchmaking, etc. later
fastify.get('/info', async () => ({ 
  service: 'backend',
  version: '1.0.0',
  features: [
    'TODO: Match results storage',
    'TODO: Tournament management',
    'TODO: Matchmaking',
    'TODO: Player stats'
  ]
}));

// Start server
fastify.listen({ port: 9000, host: '0.0.0.0' }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('Backend service running on port 9000');
});