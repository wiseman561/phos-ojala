### PHOS Docker - Dev Guide

This guide focuses on running and working with PHOS containers in development.

### Prerequisites
- Docker Desktop 4.x+
- Docker Compose v2 (included with Docker Desktop)

### Compose file
- Path: `phos/docker-compose.dev.yml`
- Uses `phos/.env` for environment configuration (copy from `phos/env.example`).

### Internal networking
- All services share a compose network and can reach each other by service name:
  - `postgres`, `redis`, `nats`, `api-gateway`, `lab-interpreter`, `nutrition-kit`, `genome-kit`, `microbiome-kit`, `sleep-kit`, `phos-core`, `phos-sync`, `phos-ui`
- Example from gateway to labs: `http://lab-interpreter:8080`

### Ports
- postgres: 5432 (host) → 5432 (container)
- redis: 6379 → 6379
- nats: 4222 (client), 8222 (monitor)
- api-gateway: 8080 → 8080
- phos-ui: 3000 → 3000
- lab-interpreter: 5101 → 8080
- nutrition-kit: 5102 → 8080
- genome-kit: 5103 → 8080
- microbiome-kit: 5104 → 8080
- sleep-kit: 5105 → 8080
- phos-core: 5200 → 8080
- phos-sync: 5201 → 8080

### Volumes
- `pgdata:/var/lib/postgresql/data` for persistent Postgres storage

### Environment variables
- Gateway:
  - `GATEWAY__PORT`, `JWT__SECRET`, `JWT__ISSUER`, `JWT__AUDIENCE`
- Service proxy targets:
  - `LAB_INTERPRETER__URL`, `NUTRITION_KIT__URL`, `GENOME_KIT__URL`, `MICROBIOME_KIT__URL`, `SLEEP_KIT__URL`, `PHOS_CORE__URL`
- Shared infra:
  - `POSTGRES__CONNECTION`, `REDIS__CONNECTION`, `NATS__URL`

### Common commands
Bring up the stack (build images if needed):
```bash
docker compose -f phos/docker-compose.dev.yml up --build
```
Run detached:
```bash
docker compose -f phos/docker-compose.dev.yml up -d
```
Stop and remove containers:
```bash
docker compose -f phos/docker-compose.dev.yml down
```
Rebuild a single service:
```bash
docker compose -f phos/docker-compose.dev.yml build nutrition-kit
```
Tail logs for one service:
```bash
docker compose -f phos/docker-compose.dev.yml logs -f api-gateway
```

### Health and routing
- Gateway Swagger at `http://localhost:8080/docs`
- Health rewrite: `/api/{svc}/healthz` → `/healthz` on the target service
- Example:
  - `curl http://localhost:8080/api/labs/healthz` (gateway → lab-interpreter)
  - `curl http://localhost:5102/healthz` (direct to nutrition-kit)

### Building images manually
Each service/app has its own Dockerfile under `phos/services/*` or `phos/apps/*`.
Examples:
```bash
# api-gateway
docker build -t phos-api-gateway:dev phos/apps/api-gateway

# lab-interpreter
docker build -t phos-lab-interpreter:dev phos/services/lab-interpreter
```

### Tips
- If ports are occupied, adjust the host-side ports in `docker-compose.dev.yml`.
- For environment updates, rebuild affected services or restart the stack.
- Use the NATS monitor at `http://localhost:8222/` to confirm connectivity.
