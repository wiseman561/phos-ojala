# Database Schemas

## lab-interpreter
- lab_results (Id PK, UserId, Timestamp, Payload JSON)

## nutrition-kit
- nutrition_events (Id PK, UserId, Timestamp, Payload JSON)

## phos-sync
- sync_events (Id PK, Subject, UserId, Timestamp, Payload JSON)

## audit-log
- audit_logs (Id PK, Timestamp, Source, UserId, Action, Payload JSON)
