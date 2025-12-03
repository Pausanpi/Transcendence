# Transcendence

A microservices-based web application with Pong game.

## Quick Start

```bash
# 1. Setup environment
cp .env.example .env

# 2. Build and run
make build
make up

# 3. Check health
make health

# 4. Access
https://localhost:8443
```

## 42 Campus Setup

```bash
# Configure Docker for goinfre
make setup-42
systemctl --user restart docker

# Then build and run
make build
make up
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          NGINX-WAF (:8443)                          │
│                     SSL Termination + Security                       │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         GATEWAY (:8080)                              │
│                        API Routing + Proxy                           │
└───────┬─────────────────────┬─────────────────────┬─────────────────┘
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  AUTH (:9200) │     │ USERS (:9100) │     │BACKEND (:9000)│
│               │     │               │     │               │
│ • Login       │     │ • Profiles    │     │ • Tournaments │
│ • Register    │     │ • GDPR        │     │ • Match stats │
│ • 2FA         │     │ • User list   │     │ • Matchmaking │
│ • JWT         │     │               │     │               │
└───────┬───────┘     └───────────────┘     └───────────────┘
        │
        ▼
┌───────────────┐     ┌───────────────┐
│ VAULT (:8200) │     │ REDIS (:6379) │
│   Secrets     │     │    Cache      │
└───────────────┘     └───────────────┘
```

---

## Services

| Service | Port | Purpose |
|---------|------|---------|
| nginx-waf | 8443 (HTTPS) | SSL + WAF security |
| gateway | 8080 | API routing |
| auth | 9200 | Authentication, JWT, 2FA |
| users | 9100 | User profiles, GDPR |
| backend | 9000 | Game logic (placeholder) |
| vault | 8200 | Secrets management |
| redis | 6379 | Cache/sessions |
| frontend | 3000 | Web UI |

---

## API Endpoints

### Auth `/api/auth/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Create account |
| POST | `/login` | Login |
| GET | `/status` | Health check |
| GET | `/vault-status` | Vault connection |
| POST | `/2fa/setup` | Enable 2FA |
| POST | `/2fa/verify` | Verify 2FA code |
| POST | `/2fa/disable` | Disable 2FA |

### Users `/api/users/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile` | Get own profile |
| PUT | `/profile` | Update profile |
| GET | `/list` | List all users |
| GET | `/status` | Health check |
| GET | `/gdpr/data` | Export personal data |
| POST | `/gdpr/anonymize` | Anonymize account |
| DELETE | `/gdpr/delete` | Delete account |
| GET | `/gdpr/consent` | Get consent status |
| POST | `/gdpr/consent` | Update consent |

### Backend `/api/backend/`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/status` | Health check |
| GET | `/info` | Service info |

---

## Make Commands

| Command | Description |
|---------|-------------|
| `make build` | Build all images |
| `make up` | Start services |
| `make down` | Stop services |
| `make restart` | Restart all |
| `make logs` | View all logs |
| `make logs-auth` | View auth logs |
| `make logs-users` | View users logs |
| `make health` | Health check all services |
| `make clean` | Remove containers + volumes |
| `make fclean` | Remove everything |
| `make setup-42` | Configure for 42 campus |

---

## Project Structure

```
probando/
├── docker-compose.yml
├── Makefile
├── .env
├── .env.example
├── .gitignore
├── README.md
├── scripts/
│   └── health-check.sh
├── base_image/
│   └── Dockerfile
├── nginx-waf/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── certs/
├── gateway/
│   ├── Dockerfile
│   ├── package.json
│   └── server.js
├── auth/
│   ├── Dockerfile
│   ├── package.json
│   ├── index.js
│   └── data/
├── users/
│   ├── Dockerfile
│   ├── package.json
│   ├── index.js
│   ├── services/
│   │   └── gdpr.js
│   └── data/
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── index.js
└── frontend/
    ├── Dockerfile
    └── ...
```

---

## Development

### Add new service

1. Create folder with `Dockerfile`, `package.json`, `index.js`
2. Add to `docker-compose.yml`
3. Add proxy route in `gateway/server.js`
4. Add nginx location in `nginx-waf/nginx.conf`

### Test API

```bash
# Register
curl -sk -X POST https://localhost:8443/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"password123"}'

# Login
curl -sk -X POST https://localhost:8443/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Use token
TOKEN="<token from login>"
curl -sk https://localhost:8443/api/users/profile \
  -H "Authorization: Bearer $TOKEN"
```

---

## Team

| Area | Assignee |
|------|----------|
| Auth/Infrastructure | |
| Frontend | |
| Game Logic | |

---

## TODO

- [ ] OAuth 42 integration
- [ ] WebSocket for real-time game
- [ ] Tournament system
- [ ] Matchmaking
- [ ] Chat system
- [ ] Friends system