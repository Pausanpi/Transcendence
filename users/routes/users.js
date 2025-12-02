export default async function usersRoutes(fastify, opts) {
  const db = fastify.db;

  // Create table if it doesn't exist
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      display_name TEXT,
      avatar TEXT,
      wins INTEGER DEFAULT 0,
      losses INTEGER DEFAULT 0,
	  created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // GET /api/users
  fastify.get("/", async () => {
    return new Promise((resolve, reject) => {
      db.all("SELECT id, username, display_name, wins, losses FROM users", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  });

  // POST /api/users/register
  fastify.post("/register", async (request, reply) => {
    const { username, password } = request.body;

    return new Promise((resolve) => {
      db.run(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, password],
        function (err) {
          if (err) resolve({ error: "User already exists" });
          else resolve({ message: "User created", id: this.lastID });
        }
      );
    });
  });
}
