import Fastify from 'fastify';
import cors from '@fastify/cors';
import initSqlJs from 'sql.js';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import GDPRService from './services/gdpr.js';

const fastify = Fastify({ logger: true });
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';
const DB_PATH = '/app/data/users.db';

// Initialize SQLite
const SQL = await initSqlJs();
let db;

if (fs.existsSync(DB_PATH)) {
  const buffer = fs.readFileSync(DB_PATH);
  db = new SQL.Database(buffer);
} else {
  db = new SQL.Database();
}

function saveDb() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

// Create tables with GDPR columns
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    displayName TEXT,
    avatar TEXT,
    bio TEXT,
    isAnonymized INTEGER DEFAULT 0,
    anonymizedAt TEXT,
    gdprConsent TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
saveDb();

// Initialize GDPR service with database
GDPRService.setDb(db);

// Helper: verify JWT and get user
function verifyToken(request) {
  const authHeader = request.headers.authorization;
  if (!authHeader) return null;
  
  try {
    const token = authHeader.replace('Bearer ', '');
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Helper: get user from DB
function getUser(query, params) {
  const stmt = db.prepare(query);
  stmt.bind(params);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return row;
  }
  stmt.free();
  return null;
}

// Plugins
await fastify.register(cors, { origin: true, credentials: true });

// ============ USER ROUTES ============

fastify.get('/status', async () => ({ status: 'ok', service: 'users' }));

fastify.get('/profile', async (request, reply) => {
  const user = verifyToken(request);
  if (!user) {
    return reply.status(401).send({ error: 'Authorization required' });
  }

  const dbUser = getUser('SELECT * FROM users WHERE id = ?', [user.id]);
  if (!dbUser) {
    // Create user profile if doesn't exist
    db.run(
      'INSERT INTO users (id, username, email) VALUES (?, ?, ?)',
      [user.id, user.username, user.email]
    );
    saveDb();
    return { id: user.id, username: user.username, email: user.email };
  }

  // Don't return sensitive fields
  delete dbUser.gdprConsent;
  return dbUser;
});

fastify.put('/profile', async (request, reply) => {
  const user = verifyToken(request);
  if (!user) {
    return reply.status(401).send({ error: 'Authorization required' });
  }

  const { displayName, avatar, bio } = request.body || {};
  
  db.run(
    'UPDATE users SET displayName = ?, avatar = ?, bio = ? WHERE id = ?',
    [displayName || null, avatar || null, bio || null, user.id]
  );
  saveDb();

  return { success: true, message: 'Profile updated' };
});

fastify.get('/list', async () => {
  const users = [];
  const stmt = db.prepare('SELECT id, username, displayName, avatar FROM users WHERE isAnonymized = 0');
  while (stmt.step()) {
    users.push(stmt.getAsObject());
  }
  stmt.free();
  return users;
});

// ============ GDPR ROUTES ============

fastify.get('/gdpr/data', async (request, reply) => {
  const user = verifyToken(request);
  if (!user) {
    return reply.status(401).send({ error: 'Authorization required' });
  }

  const data = await GDPRService.getUserDataSummary(user.id);
  if (!data) {
    return reply.status(404).send({ error: 'User not found' });
  }

  return data;
});

fastify.get('/gdpr/export', async (request, reply) => {
  const user = verifyToken(request);
  if (!user) {
    return reply.status(401).send({ error: 'Authorization required' });
  }

  const exportData = await GDPRService.exportUserData(user.id);
  if (!exportData) {
    return reply.status(404).send({ error: 'User not found' });
  }

  reply.header('Content-Type', 'application/json');
  reply.header('Content-Disposition', `attachment; filename="user-data-${user.id}.json"`);
  return exportData;
});

fastify.post('/gdpr/anonymize', async (request, reply) => {
  const user = verifyToken(request);
  if (!user) {
    return reply.status(401).send({ error: 'Authorization required' });
  }

  const { confirmPassword } = request.body || {};
  if (!confirmPassword) {
    return reply.status(400).send({ error: 'Password confirmation required' });
  }

  // Note: In production, verify password with auth service
  const result = await GDPRService.anonymizeUserData(user.id);
  saveDb();

  if (!result.success) {
    return reply.status(400).send(result);
  }

  return result;
});

fastify.delete('/gdpr/delete', async (request, reply) => {
  const user = verifyToken(request);
  if (!user) {
    return reply.status(401).send({ error: 'Authorization required' });
  }

  const { confirmPassword } = request.body || {};
  if (!confirmPassword) {
    return reply.status(400).send({ error: 'Password confirmation required' });
  }

  // Note: In production, verify password with auth service
  const result = await GDPRService.deleteUserAccount(user.id);
  saveDb();

  if (!result.success) {
    return reply.status(400).send(result);
  }

  return result;
});

fastify.get('/gdpr/consent', async (request, reply) => {
  const user = verifyToken(request);
  if (!user) {
    return reply.status(401).send({ error: 'Authorization required' });
  }

  const consent = await GDPRService.getConsent(user.id);
  return { consent };
});

fastify.post('/gdpr/consent', async (request, reply) => {
  const user = verifyToken(request);
  if (!user) {
    return reply.status(401).send({ error: 'Authorization required' });
  }

  const { analytics, marketing, thirdParty } = request.body || {};
  
  const result = await GDPRService.updateConsent(user.id, {
    analytics: !!analytics,
    marketing: !!marketing,
    thirdParty: !!thirdParty
  });
  saveDb();

  return result;
});

// Start
fastify.listen({ port: 9100, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log('Users service running on port 9100');
});