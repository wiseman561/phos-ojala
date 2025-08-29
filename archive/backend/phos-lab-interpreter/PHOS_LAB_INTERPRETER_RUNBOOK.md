# PHOS Lab Interpreter Runbook

## Ports & Envs
- Port: 8094
- Key envs: `SERVICE_TOKEN`, DB_*, `CATALOG_BUNDLE_URL`, `CATALOG_TENANT_ID`, `NATS_URL`

## Local Run
```bash
npm install
npm run build
npm start
```

## Seeding Catalog
```bash
node scripts/catalog-verify.ts src/catalog/bundles/lab_catalog.default.json
# or
npx ts-node scripts/catalog-verify.ts src/catalog/bundles/lab_catalog.default.json
```
- Load on boot: set `CATALOG_BUNDLE_URL=src/catalog/bundles/lab_catalog.default.json`

## JetStream Bootstrap
```bash
node scripts/js-bootstrap.ts
```

## Smoke Test
```bash
curl -X POST http://localhost:8094/v1/labs/interpret \
  -H 'x-service-token: dev-token' -H 'content-type: application/json' \
  -d '{
    "patientId":"p123",
    "items":[
      {"loinc":"4548-4","name":"HbA1c","value":6.1,"unit":"%"},
      {"loinc":"2160-0","name":"Creatinine","value":1.2,"unit":"mg/dL"},
      {"loinc":"6768-6","name":"ALP","value":180,"unit":"U/L"}
    ]
  }'
```

## Expected Response
- Contains `flags`, `recommendations`, `fhir.observations[]`, `fhir.diagnosticReport`

## Metrics to Check
- `catalog_miss_total`
- `rules_triggered_total`
- `interpret_published_total`
