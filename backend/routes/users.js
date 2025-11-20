export default async function (fastify, options) {
  const db = fastify.db;

  // Helper: wrap sqlite3 callback APIs in a Promise
  const allAsync = (sql, params = []) =>
    new Promise((resolve, reject) =>
      db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)))
    );

  const runAsync = (sql, params = []) =>
    new Promise((resolve, reject) =>
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID });
      })
    );

  // ✅ Get all users
  fastify.get("/", async (request, reply) => {
    const users = await allAsync("SELECT * FROM users");
    return users;
  });

  // ✅ Add a new user
  fastify.post("/", async (request, reply) => {
    const { username, password } = request.body;
    if (!username)
      return reply.code(400).send({ error: "username required" });

    try {
      const result = await runAsync(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, password || null]
      );
      return { id: result.lastID, username };
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });
  // lo mismo pero con /register para aclarar la url
    fastify.post("/register", async (request, reply) => {
    const { username, password } = request.body;
    if (!username || !password)
      return reply.code(400).send({ error: "username and password required" });

    try {
      const result = await runAsync(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, password]
      );
      return { id: result.lastID, username, message: "Registered successfully" };
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // In users.js http://localhost:8000/api/users/add/bob/123
	fastify.get("/add/:username/:password", async (request, reply) => {
	const { username, password } = request.params;
	try {
		const result = await runAsync(
		"INSERT INTO users (username, password) VALUES (?, ?)",
		[username, password]
		);
		return { id: result.lastID, username, message: "User added via GET!" };
	} catch (err) {
		return reply.code(500).send({ error: err.message });
	}
	});

}
