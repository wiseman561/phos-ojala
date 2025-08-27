# NATS Topics

- labs.result.created (publisher: lab-interpreter)
- nutrition.analysis.completed (publisher: nutrition-kit)
- core.recommendation.required (publisher: phos-sync)
- audit.log.created (publishers: lab-interpreter, nutrition-kit, phos-core)

Subscribers:
- phos-core: labs.result.created, nutrition.analysis.completed
- phos-sync: labs.result.created, nutrition.analysis.completed -> core.recommendation.required
- audit-log: audit.log.created
