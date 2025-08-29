### Authentication and RBAC

This document outlines the PHOS authentication flow and role-based access control (RBAC).

### Overview
- External Identity Provider (IdP): Auth0 or Azure AD (configurable)
- Clients: `phos-ui` (browser) authenticates via the IdP and receives a JWT access token.
- API Gateway: Validates JWTs using `JWT__SECRET` (HS256 dev) or IdP JWKS (RS256 in prod), enforces roles.
- Downstream services: Expect `Authorization: Bearer <token>` forwarded by the gateway; may perform claim-based checks if needed.

### Login Flow
1. User clicks Login in `phos-ui` → redirect to the IdP authorize URL.
2. User authenticates with the IdP (passwordless, email/password, SSO, etc.).
3. IdP redirects back to `phos-ui` callback with authorization code.
4. UI exchanges code for tokens (via IdP) and stores access token securely (e.g., httpOnly cookie or in-memory; avoid localStorage in production if possible).
5. UI sends requests to the API Gateway with `Authorization: Bearer <access_token>`.

### Token Contents
- `sub`: User identifier
- `email`: Optional email claim
- `roles`: Array of application roles, e.g., `Provider`, `Patient`, `Admin`
- `iss`, `aud`, `exp`, `iat`: Standard JWT claims

### Roles
- Provider: Access clinical endpoints (labs interpretation, genome, etc.)
- Patient: Access personal recommendations and nutrition analyses
- Admin: Manage system settings and user permissions

### Gateway Validation
- Dev: HS256 with `JWT__SECRET` from environment
- Prod: RS256 with IdP JWKS (configure issuer, audience, JWKS URL)
- Add role guards at the route/controller level to restrict access. Health and info endpoints remain public.

### Service Security
- Services are not Internet-facing; the gateway performs authentication and forwards authorized requests.
- Services can optionally validate JWTs and roles directly for defense in depth.

### Configuration
- Env vars: `JWT__SECRET`, `JWT__ISSUER`, `JWT__AUDIENCE`, IdP-specific client IDs/URLs.
- UI env: `VITE_IDP_LOGIN_URL` for login initiation; callback handling page to process tokens.


