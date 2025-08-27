# PHOS Services

- lab-interpreter: interprets lab measurements; persists results; publishes events.
- nutrition-kit: analyzes meals/macros; persists events; publishes events.
- phos-core: aggregates recommendations; subscribes to NATS topics.
- phos-sync: persists upstream events and triggers recommendation requirements.
- genome-kit: placeholder; analyzes FASTA string and returns GC/risk.
- microbiome-kit: placeholder; computes diversity score.
- sleep-kit: placeholder; computes sleep quality.
- audit-log: stores audit events from NATS and exposes query API.

Each service exposes:
- /healthz (liveness/readiness)
- /api/info (name/version)
- Swagger UI at /swagger
