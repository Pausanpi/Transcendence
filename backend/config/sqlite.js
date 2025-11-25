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
		profile_url TEXT,
		two_factor_enabled BOOLEAN DEFAULT 0,
		two_factor_secret TEXT,
		backup_codes TEXT,
		used_backup_codes TEXT,
		is_active BOOLEAN DEFAULT 1,
		login_attempts INTEGER DEFAULT 0,
		locked_until DATETIME,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		UNIQUE(oauth_provider, oauth_id)
	  )
	`;
		const sessionsTable = `
	  CREATE TABLE IF NOT EXISTS user_sessions (
		id TEXT PRIMARY KEY,
		user_id INTEGER,
		jwt_token TEXT,
		two_factor_verified BOOLEAN DEFAULT 0,
		expires_at DATETIME,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
	  )
	`;
		this.db.run(usersTable);
		this.db.run(sessionsTable);
	}
	run(sql, params = []) {
		return new Promise((resolve, reject) => {
			this.db.run(sql, params, function (err) {
				if (err) reject(err);
				else resolve({ id: this.lastID, changes: this.changes });
			});
		});
	}
	get(sql, params = []) {
		return new Promise((resolve, reject) => {
			this.db.get(sql, params, (err, row) => {
				if (err) reject(err);
				else resolve(row);
			});
		});
	}
	all(sql, params = []) {
		return new Promise((resolve, reject) => {
			this.db.all(sql, params, (err, rows) => {
				if (err) reject(err);
				else resolve(rows);
			});
		});
	}
}

export default new Database();
