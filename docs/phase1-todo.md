# Phase 1 Hardening - Ojalá Healthcare Platform

This checklist tracks the critical HIPAA-blocking issues identified in the initial security audit.

---

## 1. Authentication/RBAC Hardening

- [X] Enforce `RequireHttpsMetadata = true` in Identity service.
- [X] Implement proper JWT/OIDC login flows in frontends (RN, Patient, Employer).
- [X] Implement frontend route guards based on roles.
- [ ] Implement backend authorization policies (e.g., `[Authorize(Roles = "Provider")]`).

---

## 2. Secret Management Hardening

- [ ] Remove all hardcoded secrets (DB connection strings, JWT secrets, API keys) from code and config files.
- [ ] Implement Vault Kubernetes Auth method for injecting secrets into pods.
- [ ] Update services to read secrets from Vault-injected paths (e.g., `/vault/secrets/db-creds`).

---

## 3. Database Encryption

- [ ] Enable Transparent Data Encryption (TDE) on the SQL Server database instance (requires infrastructure access/config).
- [ ] Implement column-level encryption using EF Core Value Converters for specific sensitive PHI fields (e.g., SSN, potentially diagnoses if required).

---

## 4. Critical Dependency Patching

- [ ] Re-run `npm audit` on key services (API, Identity, RN Dashboard, Patient Portal).
- [ ] Apply `npm audit fix` where possible without breaking changes.
- [ ] Manually update or replace critical/high severity dependencies identified in the initial audit (e.g., `semver`, `webpack-dev-middleware`, `serialize-javascript`).

---

## 5. Documentation & Demo Prep

- [ ] Update `CHANGELOG.md` with Phase 1 fixes.
- [ ] Update `hardening-guidelines.md` with Vault integration details and DB encryption steps.
- [ ] Prepare a brief demo script/steps showing the hardened login flow and role protection.

