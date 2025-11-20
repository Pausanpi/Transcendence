import Fastify from "fastify";
import { openDB, initDB } from "./db/sqlite.js";
import usersRoutes from "./routes/users.js";

const fastify = Fastify({ logger: true });

const db = openDB();
initDB(db);
fastify.decorate('db', db);

fastify.register(usersRoutes, { prefix: "/api/users" });

fastify.get("/api/", async () => {
  return { hello: "world" };
});



//fastify.get("/users", async (request, reply) => {
//  fastify.db.all("SELECT * FROM users", (err, rows) => {
 //   if (err) return reply.send({ error: err.message });
  //  reply.send(rows);
//  });
//});



await fastify.listen({ host: "0.0.0.0", port: 9000 });
