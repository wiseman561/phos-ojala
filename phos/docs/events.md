# Events

## Topics

- labs.result.created: publisher lab-interpreter; payload per `phos/events/lab/LabResultCreated.schema.json`.
- nutrition.analysis.completed: publisher nutrition-kit; payload per `phos/events/nutrition/NutritionAnalysisCompleted.schema.json`.
- core.recommendation.required: publisher phos-sync.
- audit.log.created: publishers lab-interpreter, nutrition-kit, phos-core; payload per `phos/events/audit/AuditLogCreated.schema.json`.
- billing.attempted: publisher billing-gateway; payload per `phos/events/BillingAttempted.schema.json`.
- digestion.score.generated: publisher digestion-score; payload per `phos/events/DigestionScoreGenerated.schema.json`.

## Retention

NATS subjects are not persisted by default. For production, enable JetStream and configure retention/ack policies for critical subjects (audit, digestion scores).
