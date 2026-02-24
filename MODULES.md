• Major: Use a framework for both the frontend and backend.
Existe la posibilidad de que digan que no tenemos en el frontend y
se quede en un solo punto

• Major: A public API to interact with the database with a secured API key, rate
limiting, documentation, and at least 5 endpoints:
◦ GET /api/{something}
◦ POST /api/{something}
◦ PUT /api/{something}
◦ DELETE /api/{something}
NO cumplimos por la parte de la secure API key, ahora solo checkamos JWT:
🔧 To Comply, You Need To Add:
API Key System

Store API keys in Vault
Middleware to validate API keys (e.g., via X-API-Key header)
Separate from JWT authentication
Rate Limiting

Install @fastify/rate-limit package
Configure per-route or global limits
API Documentation

Install @fastify/swagger and @fastify/swagger-ui
Add schemas to your routes
Expose documentation at /api/docs

• Minor: Support for multiple languages (at least 3 languages).
Esto está fino, creo

• Minor: Support for additional browsers
Ahora mismo creo que cuela

• Major: Standard user management and authentication.
◦ Users can update their profile information. Bug menor ya apuntado
◦ Users can upload an avatar (with a default avatar if none provided). FIno
◦ Users can add other users as friends and see their online status. En teoria esta fino, repasar
◦ Users have a profile page displaying their information. Habría que añadir quizá detalles de partidas o algo

• Minor: Game statistics and match history (requires a game module).
◦ Track user game statistics (wins, losses, ranking, level, etc.). TIene pinta que bien
◦ Display match history (1v1 games, dates, results, opponents). Perfe pal pong de momento
◦ Show achievements and progression. De esto no hay
◦ Leaderboard integration. Habrái que hacer una

• Minor: Implement remote authentication with OAuth 2.0 (Google, GitHub, 42,
etc.).

• Minor: Implement a complete 2FA (Two-Factor Authentication) system for the
users.
Esto iba guay y hasta tenía manual

• Minor: User activity analytics and insights dashboard.
Esrto no está pero no es muy dificil de añadir, peor tampoco tenemos mucho que ponerle

• Major: Introduce an AI Opponent for games.
El tema de que sigue moviendose pasda la pelota

• Major: Implement WAF/ModSecurity (hardened) + HashiCorp Vault for secrets:
Creo que está todo fino, eso es cosa de cristobal

• Major: Implement a complete web-based game where users can play against each
other.
EN teoría todo guy. Pero el juego sigue corirendo si cambio pestaña

• Major: Add another game with user history and matchmaking.
No está el tracking de partidas del tic-tac-toe

• Minor: Game customization options.
◦ Power-ups, attacks, or special abilities.
◦ Different maps or themes.
◦ Customizable game settings.
◦ Default options must be available.
Cosa de Paula, hay 3 de 4

• Major: Monitoring system with Prometheus and Grafana.
Deactivated at the moment

• Major: Backend as microservices.
En teoría esa joya

• Minor: Health check and status page system with automated backups and disaster
recovery procedures.
Creo que no cumplimos por lo del recovery

• Major: Advanced analytics dashboard with data visualization.
Quizá se cumpla con grafana

• Minor: GDPR compliance features.
Me fié de cristobal. Lo de request their data, no se.