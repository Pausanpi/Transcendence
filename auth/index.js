import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import initSqlJs from 'sql.js';
import fs from 'fs';
import vaultClient from './services/vault-client.js';
import TwoFAService from './services/TwoFA.js';

const fastify = Fastify({ logger: true });
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production';
const DB_PATH = '/app/data/auth.db';

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

// Create tables
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    TwoFAEnabled INTEGER DEFAULT 0,
    TwoFASecret TEXT,
    backupCodes TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);
saveDb();

// Helper functions
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

function updateUser(id, updates) {
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = Object.values(updates);
  db.run(`UPDATE users SET ${fields} WHERE id = ?`, [...values, id]);
  saveDb();
}

// Plugins
await fastify.register(cors, { origin: true, credentials: true });
await fastify.register(cookie);

// Store pending 2FA setups in memory
const pendingTwoFA = new Map();

// ============ AUTH ROUTES ============

fastify.get('/status', async () => ({ status: 'ok', service: 'auth' }));

fastify.get('/vault-status', async () => {
  const healthy = await vaultClient.healthCheck();
  return { vault: healthy ? 'connected' : 'disconnected' };
});

fastify.post('/register', async (request, reply) => {
  const { username, email, password } = request.body || {};

  if (!username || !email || !password) {
    return reply.status(400).send({ error: 'Username, email and password required' });
  }

  if (password.length < 8) {
    return reply.status(400).send({ error: 'Password must be at least 8 characters' });
  }

  const existing = getUser('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
  if (existing) {
    return reply.status(400).send({ error: 'User already exists' });
  }

  const id = 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  const hashedPassword = await bcrypt.hash(password, 10);

  db.run('INSERT INTO users (id, username, email, password) VALUES (?, ?, ?, ?)', 
    [id, username, email, hashedPassword]);
  saveDb();

  const token = jwt.sign({ id, username, email }, JWT_SECRET, { expiresIn: '24h' });

  return { success: true, token, user: { id, username, email } };
});

fastify.post('/login', async (request, reply) => {
  const { email, password } = request.body || {};

  if (!email || !password) {
    return reply.status(400).send({ error: 'Email and password required' });
  }

  const user = getUser('SELECT * FROM users WHERE email = ?', [email]);
  if (!user) {
    return reply.status(401).send({ error: 'Invalid credentials' });
  }

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword) {
    return reply.status(401).send({ error: 'Invalid credentials' });
  }

  // Check if 2FA is enabled
  if (user.TwoFAEnabled) {
    const tempToken = jwt.sign({ id: user.id, pendingTwoFA: true }, JWT_SECRET, { expiresIn: '5m' });
    return { 
      success: true, 
      requiresTwoFA: true, 
      tempToken,
      message: '2FA verification required' 
    };
  }

  const token = jwt.sign({ 
    id: user.id, 
    username: user.username, 
    email: user.email,
    TwoFAEnabled: false
  }, JWT_SECRET, { expiresIn: '24h' });

  return { success: true, token, user: { id: user.id, username: user.username, email: user.email } };
});

fastify.post('/verify', async (request, reply) => {
  const { token } = request.body || {};

  if (!token) {
    return reply.status(400).send({ valid: false, error: 'Token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { valid: true, user: decoded };
  } catch {
    return { valid: false, error: 'Invalid token' };
  }
});

fastify.post('/logout', async () => ({ success: true }));

// ============ 2FA ROUTES ============

fastify.get('/2fa/status', async (request, reply) => {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    return reply.status(401).send({ error: 'Authorization required' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = getUser('SELECT TwoFAEnabled FROM users WHERE id = ?', [decoded.id]);
    
    return { TwoFAEnabled: user?.TwoFAEnabled === 1 };
  } catch {
    return reply.status(401).send({ error: 'Invalid token' });
  }
});

fastify.post('/2fa/setup', async (request, reply) => {
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    return reply.status(401).send({ error: 'Authorization required' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = getUser('SELECT * FROM users WHERE id = ?', [decoded.id]);

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    if (user.TwoFAEnabled) {
      return reply.status(400).send({ error: '2FA already enabled' });
    }

    const secretData = TwoFAService.generateSecret(user);
    const qrCode = await TwoFAService.generateQRCode(secretData.otpauth_url);

    // Store pending setup
    pendingTwoFA.set(decoded.id, {
      secret: secretData.secret,
      createdAt: Date.now()
    });

    return {
      success: true,
      secret: secretData.secret,
      qrCode,
      expiresIn: 5 * 60 * 1000
    };
  } catch (error) {
    return reply.status(401).send({ error: 'Invalid token' });
  }
});

fastify.post('/2fa/verify', async (request, reply) => {
  const authHeader = request.headers.authorization;
  const { token: totpToken } = request.body || {};

  if (!authHeader) {
    return reply.status(401).send({ error: 'Authorization required' });
  }

  if (!totpToken || !/^\d{6}$/.test(totpToken)) {
    return reply.status(400).send({ error: '6-digit code required' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const pending = pendingTwoFA.get(decoded.id);
    if (!pending) {
      return reply.status(400).send({ error: '2FA setup expired or not started' });
    }

    const verified = TwoFAService.verifyToken(pending.secret, totpToken);
    if (!verified) {
      return reply.status(400).send({ error: 'Invalid code' });
    }

    // Generate backup codes
    const backupCodes = TwoFAService.generateBackupCodes();

    // Enable 2FA
    updateUser(decoded.id, {
      TwoFAEnabled: 1,
      TwoFASecret: pending.secret,
      backupCodes: JSON.stringify(backupCodes)
    });

    pendingTwoFA.delete(decoded.id);

    return { success: true, backupCodes, message: '2FA enabled successfully' };
  } catch {
    return reply.status(401).send({ error: 'Invalid token' });
  }
});

fastify.post('/2fa/verify-login', async (request, reply) => {
  const { tempToken, totpToken } = request.body || {};

  if (!tempToken || !totpToken) {
    return reply.status(400).send({ error: 'Token and code required' });
  }

  try {
    const decoded = jwt.verify(tempToken, JWT_SECRET);
    
    if (!decoded.pendingTwoFA) {
      return reply.status(400).send({ error: 'Invalid temp token' });
    }

    const user = getUser('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    // Try TOTP first
    let verified = TwoFAService.verifyToken(user.TwoFASecret, totpToken);
    
    // Try backup code if TOTP fails
    if (!verified && user.backupCodes) {
      const backupCodes = JSON.parse(user.backupCodes);
      if (backupCodes.includes(totpToken)) {
        verified = true;
        const updatedCodes = backupCodes.filter(c => c !== totpToken);
        updateUser(user.id, { backupCodes: JSON.stringify(updatedCodes) });
      }
    }

    if (!verified) {
      return reply.status(400).send({ error: 'Invalid code' });
    }

    const token = jwt.sign({ 
      id: user.id, 
      username: user.username, 
      email: user.email,
      TwoFAEnabled: true,
      TwoFAVerified: true
    }, JWT_SECRET, { expiresIn: '24h' });

    return { success: true, token, user: { id: user.id, username: user.username, email: user.email } };
  } catch {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
});

fastify.post('/2fa/disable', async (request, reply) => {
  const authHeader = request.headers.authorization;
  const { token: totpToken } = request.body || {};

  if (!authHeader) {
    return reply.status(401).send({ error: 'Authorization required' });
  }

  if (!totpToken || !/^\d{6}$/.test(totpToken)) {
    return reply.status(400).send({ error: '6-digit code required' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = getUser('SELECT * FROM users WHERE id = ?', [decoded.id]);

    if (!user || !user.TwoFAEnabled) {
      return reply.status(400).send({ error: '2FA not enabled' });
    }

    const verified = TwoFAService.verifyToken(user.TwoFASecret, totpToken);
    if (!verified) {
      return reply.status(400).send({ error: 'Invalid code' });
    }

    updateUser(decoded.id, {
      TwoFAEnabled: 0,
      TwoFASecret: null,
      backupCodes: null
    });

    return { success: true, message: '2FA disabled' };
  } catch {
    return reply.status(401).send({ error: 'Invalid token' });
  }
});


// ============ INTERNAL ROUTES (service-to-service) ============

const INTERNAL_SECRET = process.env.INTERNAL_SECRET || 'internal-service-secret';

fastify.post('/internal/delete-user', async (request, reply) => {
  const internalSecret = request.headers['x-internal-secret'];
  
  if (internalSecret !== INTERNAL_SECRET) {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  const { userId } = request.body || {};
  
  if (!userId) {
    return reply.status(400).send({ error: 'userId required' });
  }

  db.run('DELETE FROM users WHERE id = ?', [userId]);
  saveDb();

  console.log(`[INTERNAL] Deleted auth credentials for user: ${userId}`);
  return { success: true, message: 'User credentials deleted' };
});

fastify.post('/internal/anonymize-user', async (request, reply) => {
  const internalSecret = request.headers['x-internal-secret'];
  
  if (internalSecret !== INTERNAL_SECRET) {
    return reply.status(403).send({ error: 'Forbidden' });
  }

  const { userId } = request.body || {};
  
  if (!userId) {
    return reply.status(400).send({ error: 'userId required' });
  }

  const anonymousId = 'anon_' + Math.random().toString(36).substr(2, 9);
  
  db.run(`
    UPDATE users SET 
      username = ?,
      email = ?,
      password = 'ANONYMIZED',
      TwoFASecret = NULL,
      backupCodes = NULL
    WHERE id = ?
  `, [
    `anonymous_${anonymousId}`,
    `${anonymousId}@anonymized.local`,
    userId
  ]);
  saveDb();

  console.log(`[INTERNAL] Anonymized auth credentials for user: ${userId}`);
  return { success: true, message: 'User credentials anonymized' };
});

// Start
fastify.listen({ port: 9200, host: '0.0.0.0' }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log('Auth service running on port 9200');
});