# Compliance Checklist (HIPAA-oriented)

- Authentication & Authorization
  - OIDC JWT validation with issuer/audience
  - Role-Based Access Control in UI and APIs
- Transport Security
  - TLS termination at gateway/ingress
  - HTTPS redirection at services
- Audit Logging
  - `audit.log.created` events and centralized storage
  - UI audit trail for admins
- Rate Limiting & Throttling
  - API Gateway global limits; per-route limits in services
- Data Protection
  - Secrets via Vault (non-dev), env fallback in dev
  - Postgres access with least privilege (to be enforced in prod)
- Observability
  - OpenTelemetry tracing, Prometheus metrics, Grafana dashboards
- Encryption at Rest (to be enabled in managed DB/storage)
- Backup & DR (out of scope for dev; document in runbook)
