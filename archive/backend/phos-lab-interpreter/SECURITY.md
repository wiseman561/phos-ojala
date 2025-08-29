# Security and Compliance Summary

- MFA for UIs; TLS in transit and at rest.
- Audit logging via `src/common/audit.ts` with SHA256 payload hashing (no PHI stored).
- Minimum necessary data across services; PHI never logged.
- FDA CDS: maintain independent review for clinical decision support.
- Disable TypeORM `synchronize` in production; use migrations.
- Secrets managed via Vault or platform KMS; rotate regularly.
