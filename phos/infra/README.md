### PHOS Infra - Development Setup

This document describes how to run the PHOS development stack using Docker Compose, the environment variables required, service ports, and internal routing via the API Gateway.

### What runs in dev
- api-gateway (NestJS)
- phos-ui (Vite React app)
- lab-interpreter (.NET 8 minimal API)
- nutrition-kit (.NET 8 minimal API)
- genome-kit (.NET 8 minimal API, stub)
- microbiome-kit (.NET 8 minimal API, stub)
- sleep-kit (.NET 8 minimal API, stub)
- phos-core (.NET 8 minimal API)
- phos-sync (.NET 8 minimal API)
- postgres (16)
- redis (7)
- nats (2)

### Environment configuration
Create a local env file by copying the example:
```bash
cp phos/env.example phos/.env
```
Key variables (defaults in `phos/env.example`):
- GATEWAY__PORT: API Gateway listen port (default 8080)
- JWT__SECRET / JWT__ISSUER / JWT__AUDIENCE: Gateway JWT config (dev defaults)
- LAB_INTERPRETER__URL, NUTRITION_KIT__URL, GENOME_KIT__URL, MICROBIOME_KIT__URL, SLEEP_KIT__URL, PHOS_CORE__URL: internal service URLs the gateway proxies to
- POSTGRES__CONNECTION: connection string used by services
- REDIS__CONNECTION: Redis host/port
- NATS__URL: NATS server URL

### Docker Compose (dev)
Compose file: `phos/docker-compose.dev.yml`

Services and ports:
- postgres: 5432:5432, volume `pgdata:/var/lib/postgresql/data`
- redis: 6379:6379
- nats: 4222:4222 (client), 8222:8222 (monitor)
- api-gateway: 8080:8080
- phos-ui: 3000:3000
- lab-interpreter: 5101:8080
- nutrition-kit: 5102:8080
- genome-kit: 5103:8080
- microbiome-kit: 5104:8080
- sleep-kit: 5105:8080
- phos-core: 5200:8080
- phos-sync: 5201:8080

Volumes:
- pgdata: persists Postgres data locally

### How to run
From repo root:
```bash
docker compose -f phos/docker-compose.dev.yml up --build
```
Run detached:
```bash
docker compose -f phos/docker-compose.dev.yml up --build -d
```
Rebuild a single service:
```bash
docker compose -f phos/docker-compose.dev.yml build lab-interpreter
```

### API Gateway routing
Gateway base: `http://localhost:8080`
- Swagger docs: `/docs`
- JWT is optional in dev (seeded token in UI); configure via JWT__* envs

Proxy mappings (from env):
- `/api/labs` -> `LAB_INTERPRETER__URL`
- `/api/nutrition` -> `NUTRITION_KIT__URL`
- `/api/genome` -> `GENOME_KIT__URL`
- `/api/microbiome` -> `MICROBIOME_KIT__URL`
- `/api/sleep` -> `SLEEP_KIT__URL`
- `/api/core` -> `PHOS_CORE__URL`

Health forwarding:
- `/api/{svc}/healthz` is rewritten to `/healthz` on the target service.

### Health checks & examples
- Gateway health: `GET http://localhost:8080/health`
- Labs (via gateway): `POST http://localhost:8080/api/labs/interpret`
- Nutrition (via gateway): `POST http://localhost:8080/api/nutrition/analyze`
- Recommendations (via gateway): `GET http://localhost:8080/api/core/recommendations?userId=u123`
- Direct service health: e.g. `http://localhost:5101/healthz` (lab-interpreter)

### Troubleshooting
- Ensure `.env` exists at `phos/.env`. See `phos/env.example`.
- Check container logs: `docker compose -f phos/docker-compose.dev.yml logs -f api-gateway`
- Verify NATS monitor: `http://localhost:8222/`
- Verify Postgres reachable: `psql -h localhost -U phos -d phos` (password `phos` by default)
