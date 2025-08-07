# JWT Secret Migration to Vault - Implementation Summary

## Overview
This document summarizes the changes made to migrate hardcoded JWT secrets to HashiCorp Vault for HIPAA compliance (§164.312(a)(2)(iv) - Encryption and Decryption).

## Changes Made

### 1. Application Configuration Updates

#### Phos.Api Service
- **File:** `src/backend/Phos.Api/appsettings.json`
  - Added `JwtSettings` section with `SecretKeyPath` pointing to `/vault/secrets/jwt-secret.json`
  - Removed hardcoded JWT secret values

- **File:** `src/backend/Phos.Api/appsettings.Development.json`
  - Updated to use `SecretKeyPath` instead of hardcoded `SecretKey`
  - Standardized issuer and audience values

- **File:** `src/backend/Phos.Api/Startup.cs`
  - Added `GetJwtSecretKey()` method to read secret from Vault-mounted file
  - Updated JWT configuration to use the secret from file
  - Added proper error handling for missing files

#### Phos.Identity Service
- **File:** `src/backend/Phos.Identity/appsettings.json`
  - Updated `JwtSettings` to use `SecretKeyPath` instead of hardcoded `Secret`
  - Standardized issuer and audience values

- **File:** `src/backend/Phos.Identity/appsettings.Development.json`
  - Updated to use `SecretKeyPath` instead of hardcoded `SecretKey`

- **File:** `src/backend/Phos.Identity/Services/TokenService.cs`
  - Added `GetJwtSecretKey()` method to read secret from Vault-mounted file
  - Updated both `GenerateJwtToken()` and `ValidateToken()` methods
  - Added proper error handling for missing files

### 2. Vault Template Configuration

#### API Service Templates
- **File:** `vault/api/jwt-secret.tpl` (NEW)
  - Creates `/vault/secrets/jwt-secret.json` with JWT secret data
  - Uses `phos-secrets/api` Vault path

- **File:** `vault/api/agent.hcl`
  - Updated to use Kubernetes auth method instead of token auth
  - Added template for JWT secret file
  - Configured for `api-role` service account

#### Identity Service Templates
- **File:** `vault/identity/jwt-secret.tpl` (NEW)
  - Creates `/vault/secrets/jwt-secret.json` with JWT secret data
  - Uses `phos-secrets/identity` Vault path

- **File:** `vault/identity/agent.hcl`
  - Updated to use Kubernetes auth method instead of token auth
  - Added template for JWT secret file
  - Configured for `identity-role` service account

### 3. Kubernetes Deployment Configuration

#### API Service Deployment
- **File:** `infra/kubernetes/phos-api-deployment.yaml`
  - Updated ConfigMap reference to include `jwt-secret.tpl`
  - Ensured proper volume mounting for Vault secrets

- **File:** `infra/kubernetes/vault-agent-api-configmap.yaml` (NEW)
  - Created ConfigMap containing all Vault agent configuration
  - Includes `agent.hcl`, `appsettings.tpl`, and `jwt-secret.tpl`

## Security Improvements

### Before Migration
- ❌ JWT secrets hardcoded in configuration files
- ❌ Secrets visible in source code and logs
- ❌ No secret rotation capability
- ❌ Violates HIPAA §164.312(a)(2)(iv)

### After Migration
- ✅ JWT secrets stored securely in HashiCorp Vault
- ✅ Secrets loaded at runtime via Vault Agent sidecar
- ✅ No secrets in source code or configuration files
- ✅ Supports secret rotation and audit logging
- ✅ Complies with HIPAA §164.312(a)(2)(iv)

## File Structure

```
/vault/secrets/
├── appsettings.json          # Main application configuration
├── jwt-secret.json           # JWT secret data (NEW)
└── token                     # Vault authentication token

/vault/config/
├── agent.hcl                 # Vault agent configuration
├── appsettings.tpl           # Application settings template
└── jwt-secret.tpl            # JWT secret template (NEW)
```

## Deployment Steps

1. **Apply ConfigMap:**
   ```bash
   kubectl apply -f infra/kubernetes/vault-agent-api-configmap.yaml
   ```

2. **Deploy Updated Services:**
   ```bash
   kubectl apply -f infra/kubernetes/phos-api-deployment.yaml
   ```

3. **Verify Vault Integration:**
   - Check that `/vault/secrets/jwt-secret.json` exists in containers
   - Verify JWT token generation works correctly
   - Monitor Vault agent logs for any errors

## Error Handling

The implementation includes comprehensive error handling:

- **Missing Configuration:** Throws `InvalidOperationException` if `SecretKeyPath` not configured
- **Missing File:** Throws `InvalidOperationException` if secret file not found
- **Invalid JSON:** Handles JSON parsing errors gracefully
- **Missing Secret:** Throws `InvalidOperationException` if secret not found in file

## Testing

### Development Testing
1. Start Vault in development mode
2. Load test secrets into Vault
3. Run services locally with Vault integration
4. Verify JWT token generation and validation

### Production Testing
1. Deploy to staging environment
2. Verify Vault Agent sidecar starts correctly
3. Test JWT authentication flow
4. Monitor logs for any secret-related errors

## Compliance Status

- ✅ **HIPAA §164.312(a)(2)(iv)** - Encryption and Decryption: JWT secrets now encrypted at rest in Vault
- ✅ **HIPAA §164.308(a)(4)(i)** - Access Control: Secrets accessed via Kubernetes service accounts
- ✅ **HIPAA §164.312(c)(1)** - Integrity: Vault provides audit trails for secret access

## Next Steps

1. **Secret Rotation:** Implement automated JWT secret rotation
2. **Monitoring:** Add alerts for Vault agent failures
3. **Backup:** Ensure Vault secrets are properly backed up
4. **Documentation:** Update operational runbooks for secret management

## Rollback Plan

If issues arise, the system can be rolled back by:

1. Reverting configuration files to use hardcoded secrets
2. Removing Vault Agent sidecar from deployments
3. Restarting services with original configuration

**Note:** Rollback should only be used temporarily while fixing Vault integration issues. 
