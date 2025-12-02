const INTERNAL_SECRET = process.env.INTERNAL_SECRET || 'internal-service-secret';
const AUTH_SERVICE_URL = 'http://auth:9200';

class GDPRService {
  constructor() {
    this.db = null;
  }

  setDb(database) {
    this.db = database;
  }

  // NEW: Helper to call auth service
  async notifyAuthService(endpoint, userId) {
    try {
      const response = await fetch(`${AUTH_SERVICE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Secret': INTERNAL_SECRET
        },
        body: JSON.stringify({ userId })
      });
      
      if (!response.ok) {
        console.error(`Auth service returned ${response.status}`);
        return false;
      }
      
      return true;
    } catch (err) {
      console.error('Failed to notify auth service:', err.message);
      return false;
    }
  }

  async getUserDataSummary(userId) {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    stmt.bind([userId]);
    
    if (!stmt.step()) {
      stmt.free();
      return null;
    }

    const user = stmt.getAsObject();
    stmt.free();

    return {
      personalData: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName || null,
        avatar: user.avatar || null,
        createdAt: user.createdAt
      },
      dataCategories: [
        { category: 'Identity', description: 'Username, email, display name' },
        { category: 'Profile', description: 'Avatar, bio' },
        { category: 'Authentication', description: 'Stored in auth service' }
      ],
      isAnonymized: user.isAnonymized === 1,
      anonymizedAt: user.anonymizedAt || null
    };
  }

  async exportUserData(userId) {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    stmt.bind([userId]);
    
    if (!stmt.step()) {
      stmt.free();
      return null;
    }

    const user = stmt.getAsObject();
    stmt.free();

    return {
      exportDate: new Date().toISOString(),
      userId: userId,
      data: {
        profile: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName || null,
          avatar: user.avatar || null,
          bio: user.bio || null,
          createdAt: user.createdAt
        },
        settings: {
          gdprConsent: user.gdprConsent ? JSON.parse(user.gdprConsent) : null
        }
      },
      format: 'JSON',
      version: '1.0'
    };
  }

  async anonymizeUserData(userId) {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    stmt.bind([userId]);
    
    if (!stmt.step()) {
      stmt.free();
      return { success: false, error: 'User not found' };
    }

    const user = stmt.getAsObject();
    stmt.free();

    if (user.isAnonymized === 1) {
      return { success: false, error: 'User already anonymized' };
    }

    const anonymousId = 'anon_' + Math.random().toString(36).substr(2, 9);
    const anonymizedAt = new Date().toISOString();

    // Anonymize in users database
    this.db.run(`
      UPDATE users SET 
        username = ?,
        email = ?,
        displayName = NULL,
        avatar = NULL,
        bio = NULL,
        isAnonymized = 1,
        anonymizedAt = ?
      WHERE id = ?
    `, [
      `anonymous_${anonymousId}`,
      `${anonymousId}@anonymized.local`,
      anonymizedAt,
      userId
    ]);

    // NEW: Notify auth service
    const authNotified = await this.notifyAuthService('/internal/anonymize-user', userId);

    return {
      success: true,
      message: 'User data anonymized successfully',
      anonymizedAt: anonymizedAt,
      authServiceNotified: authNotified
    };
  }

  async deleteUserAccount(userId) {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT id FROM users WHERE id = ?');
    stmt.bind([userId]);
    
    if (!stmt.step()) {
      stmt.free();
      return { success: false, error: 'User not found' };
    }
    stmt.free();

    // Delete from users database
    this.db.run('DELETE FROM users WHERE id = ?', [userId]);

    // NEW: Notify auth service
    const authNotified = await this.notifyAuthService('/internal/delete-user', userId);

    return {
      success: true,
      message: 'Account permanently deleted',
      deletedAt: new Date().toISOString(),
      authServiceNotified: authNotified
    };
  }

  async updateConsent(userId, consent) {
    if (!this.db) throw new Error('Database not initialized');

    const consentData = {
      ...consent,
      updatedAt: new Date().toISOString()
    };

    this.db.run(
      'UPDATE users SET gdprConsent = ? WHERE id = ?',
      [JSON.stringify(consentData), userId]
    );

    return { success: true, consent: consentData };
  }

  async getConsent(userId) {
    if (!this.db) throw new Error('Database not initialized');

    const stmt = this.db.prepare('SELECT gdprConsent FROM users WHERE id = ?');
    stmt.bind([userId]);
    
    if (!stmt.step()) {
      stmt.free();
      return null;
    }

    const row = stmt.getAsObject();
    stmt.free();

    return row.gdprConsent ? JSON.parse(row.gdprConsent) : null;
  }
}

export default new GDPRService();