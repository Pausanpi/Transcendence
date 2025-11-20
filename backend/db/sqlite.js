import sqlite3 from 'sqlite3';

export function openDB() {
  const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) console.error('DB opening error:', err);
    else console.log('Database opened');
  });
  return db;
}

export function initDB(db) {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(
      `INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`,
      ['admin', 'secret']
    );
  });
}
