# PHOS Lab Interpreter

A NestJS microservice for ingesting and interpreting laboratory results in PHOS.

## Features
- REST + Swagger (`/docs`), gRPC (`proto/lab_interpreter.proto`), eventing (NATS `phos.labs.interpreted.v1`).
- JSON-logic rules engine with LOINC name mapping.
- Postgres persistence, Redis caching, Prometheus `/metrics`, health `/health`.
- Service-to-service auth via `x-service-token` header.

## Quickstart
```bash
docker compose up --build
curl -X POST localhost:8094/v1/labs/interpret \
  -H 'x-service-token: dev-token' -H 'content-type: application/json' \
  -d '{
    "patientId":"p123",
    "items":[
      {"loinc":"4548-4", "name":"HbA1c", "value":6.1, "unit":"%"},
      {"loinc":"2089-1", "name":"LDL-C", "value":172, "unit":"mg/dL"}
    ]
  }'
```

## Integrations

* **NATS**: emits interpretation events for downstream services (NutritionKit, Alerts, CarePlan).
* **gRPC**: fetches patient context from `profiles` service (swap stub for real client).
* **FHIR**: map readings to `Observation` if needed.

## Hardening (prod)

* Disable TypeORM `synchronize`; use migrations.
* Load rules from signed bundles (S3/Config service) with version pinning.
* Add circuit breaker/retry for all outbound calls.
* Wire OpenTelemetry exporter.

## Lab Catalog

- Seed bundle: `src/catalog/bundles/lab_catalog.default.json`
- Verify and register hash/version:
```bash
cd src/backend/phos-lab-interpreter
export DB_HOST=postgres DB_PORT=5432 DB_USER=phos DB_PASS=phos DB_NAME=phos_labs
npx ts-node scripts/catalog-verify.ts src/catalog/bundles/lab_catalog.default.json
```
- Auto-load on boot: set `CATALOG_BUNDLE_URL=src/catalog/bundles/lab_catalog.default.json`
- Hot-reload: publish on NATS `phos.catalog.updated.v1` with payload:
```json
{ "bundleVersion": "v1.0.1", "url": "src/catalog/bundles/lab_catalog.default.json" }
```


