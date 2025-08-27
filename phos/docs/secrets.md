# Secrets and Vault Integration

PHOS services support two modes:

- Development: use environment variables from `phos/.env`.
- Non-development (recommended): enable Vault and fetch secrets at startup.

## Toggle

- `VAULT__ENABLED=true` (or `VAULT_ENABLED=true`) forces services to read secrets from Vault and fail fast if any required secret is missing.

## Default KV path

- Path: `secret/data/phos`
- Keys (examples):
  - `POSTGRES__CONNECTION` (e.g., `Host=postgres;Database=phos;Username=phos;Password=...`)
  - `NATS__URL` (e.g., `nats://nats:4222`)
  - `IDP__ISSUER` (e.g., `https://your-tenant.auth0.com/`)
  - `IDP__AUDIENCE` (e.g., `https://api.phos.local`)
  - `OTLP__ENDPOINT` (optional)

## Required keys per service

- lab-interpreter: `POSTGRES__CONNECTION`, `NATS__URL`, `IDP__ISSUER`, `IDP__AUDIENCE`
- nutrition-kit: `POSTGRES__CONNECTION`, `NATS__URL`, `IDP__ISSUER`, `IDP__AUDIENCE`
- phos-core: `NATS__URL`, `IDP__ISSUER`, `IDP__AUDIENCE`
- phos-sync: `POSTGRES__CONNECTION`, `NATS__URL`
- audit-log: `POSTGRES__CONNECTION`, `NATS__URL`
- billing-gateway: `NATS__URL`, `IDP__ISSUER`, `IDP__AUDIENCE`
- phos-fhir-bridge: `IDP__ISSUER`, `IDP__AUDIENCE`
- digestion-score: `POSTGRES__CONNECTION`, `NATS__URL`

## Vault Agent Injector (Helm)

When deploying to Kubernetes with Vault Agent Injector, set values in each chart:

```yaml
vault:
  enabled: true
  role: phos-app
  path: secret/data/phos
```

This adds pod annotations like:

- `vault.hashicorp.com/agent-inject: "true"`
- `vault.hashicorp.com/role: <role>`
- `vault.hashicorp.com/agent-inject-secret-config: <path>`

Agent will expose secrets to the pod; services still validate required keys at startup.
