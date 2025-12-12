import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class Database {
	constructor() {
		this.db = null;
		this.init();
	}

	init() {
		const dbPath = path.join(__dirname, '../../data/app.db');
		this.db = new sqlite3.Database(dbPath, (err) => {
			if (err) {
				console.error('Error connecting to SQLite:', err.message);
			} else {
				this.createTables();
			}
		});
	}

	createTables() {
		const usersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT NOT NULL,
                email TEXT UNIQUE,
                password_hash TEXT,
                oauth_provider TEXT,
                oauth_id TEXT,
                avatar TEXT,
                two_factor_enabled BOOLEAN DEFAULT 0,
                two_factor_secret TEXT,
                is_active BOOLEAN DEFAULT 1,
                is_anonymized BOOLEAN DEFAULT 0,
                login_attempts INTEGER DEFAULT 0,
                locked_until DATETIME,
                consent_marketing BOOLEAN DEFAULT 0,
                consent_analytics BOOLEAN DEFAULT 0,
                consent_data_processing BOOLEAN DEFAULT 1,
                consent_updated_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(oauth_provider, oauth_id)
            )
        `;

		const sessionsTable = `
            CREATE TABLE IF NOT EXISTS user_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                jwt_token TEXT,
                expires_at DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        `;

		const backupCodesTable = `
            CREATE TABLE IF NOT EXISTS backup_codes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                code_hash TEXT NOT NULL,
                used BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
        `;

		this.run(usersTable).catch(err => {
			console.error('Error creating users table:', err);
		});

		this.run(sessionsTable).catch(err => {
			console.error('Error creating sessions table:', err);
		});

		this.run(backupCodesTable).catch(err => {
			console.error('Error creating backup_codes table:', err);
		});
	}

	run(sql, params = []) {
		return new Promise((resolve, reject) => {
			this.db.run(sql, params, function (err) {
				if (err) {
					console.error('SQL Error:', err);
					console.error('SQL Statement:', sql);
					console.error('Parameters:', params);
					reject(err);
				} else {
					resolve({ id: this.lastID, changes: this.changes });
				}
			});
		});
	}

	get(sql, params = []) {
		return new Promise((resolve, reject) => {
			this.db.get(sql, params, (err, row) => {
				if (err) {
					console.error('SQL Error:', err);
					console.error('SQL Statement:', sql);
					console.error('Parameters:', params);
					reject(err);
				} else {
					resolve(row);
				}
			});
		});
	}

	all(sql, params = []) {
		return new Promise((resolve, reject) => {
			this.db.all(sql, params, (err, rows) => {
				if (err) {
					console.error('SQL Error:', err);
					console.error('SQL Statement:', sql);
					console.error('Parameters:', params);
					reject(err);
				} else {
					resolve(rows);
				}
			});
		});
	}

	close() {
		return new Promise((resolve, reject) => {
			this.db.close((err) => {
				if (err) reject(err);
				else resolve();
			});
		});
	}
}

export default new Database();
