# Release Checklist (Done-Done)

- [ ] All services build and run locally
  - `docker compose -f phos/docker-compose.dev.yml up --build`
  - Health endpoints respond (gateway + services)
- [ ] Gateway proxies and secures routes
  - Public: `/healthz`, `/info`
  - Protected: `/api/*` requires JWT; rate limits enforced; 429 includes `Retry-After`
- [ ] Observability stack shows traces/metrics/logs
  - OTEL collector receiving; Prometheus scraping; Grafana dashboards present
  - Tempo (if enabled) shows end-to-end traces
- [ ] Vault on by default in non-dev
  - `VAULT__ENABLED=true` outside Development; services fail fast on missing keys
  - Required keys present at `secret/data/phos`
- [ ] Helm renders with correct values and probes
  - `helm lint charts/*` passes
  - Probes: readiness/liveness to `/healthz`; securityContext set (non-root, user 1000, readOnlyRootFilesystem)
- [ ] E2E tests passing
  - Integration tests (Testcontainers) for billing and digestion-score pass locally and in CI
- [ ] Admin UI shows audit logs; roles enforced
  - Admin-only pages (Audit Logs, Billing, FHIR) require `Admin` role; unauthorized redirected
- [ ] SBOM + vulnerability thresholds enforced in CI
  - SBOM attached to images; Trivy fails on HIGH/CRITICAL (configurable)

When all items are satisfied, tag a minor release and attach the SBOM:

```bash
git tag -a vX.Y.0 -m "PHOS minor release"
git push origin vX.Y.0
```
