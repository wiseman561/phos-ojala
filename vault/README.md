# Vault Secret Management for Phos API

This directory contains the complete HashiCorp Vault setup for secure secret management in the Phos API.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Phos API     │    │   Vault Agent    │    │   Vault Server  │
│                 │    │                  │    │                 │
│ Reads JWT       │◄───┤ Renders secrets  │◄───┤ Stores secrets  │
│ from file       │    │ from templates   │    │ securely        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Directory Structure

```
vault/
├── Dockerfile                    # Vault Agent container
├── vault-agent.hcl              # Vault Agent configuration
├── templates/
│   └── jwt-secret.json.tpl      # JWT secret template
├── policies/
│   └── phos-api-policy.hcl     # Vault policy for API access
├── scripts/
│   ├── init-vault.sh            # Vault initialization script
│   └── rotate-jwt-secret.sh     # Secret rotation script
└── README.md                    # This file
```

## Quick Start

### 1. Initialize Vault

```bash
# Start Vault server
docker-compose up vault -d

# Wait for Vault to be ready, then initialize
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=phos-dev-token

# Run initialization script
chmod +x vault/scripts/init-vault.sh
./vault/scripts/init-vault.sh
```

### 2. Start the Application

```bash
# Start all services
docker-compose up -d
```

### 3. Verify Setup

```bash
# Check if JWT secret file exists
docker exec phos-api ls -la /vault/secrets/

# Test health endpoint
curl http://localhost:5000/health
```

## Configuration Details

### Vault Agent Configuration (`vault-agent.hcl`)

- **Authentication**: Uses AppRole method
- **Templates**: Renders JWT secret to `/vault/secrets/jwt-secret.json`
- **Auto-renewal**: Automatically renews tokens
- **File watching**: Monitors secret changes for rotation

### JWT Secret Template (`jwt-secret.json.tpl`)

Renders the following JSON structure:
```json
{
  "secret": "base64-encoded-jwt-secret",
  "issuer": "PhosHealthcarePlatform",
  "audience": "PhosHealthcarePlatformClients",
  "expiry_minutes": "60"
}
```

### Vault Policy (`phos-api-policy.hcl`)

Grants the following permissions:
- Read access to `secret/data/jwt-secret`
- Read access to secret metadata for rotation
- List access to secret metadata

## Secret Management

### Rotating JWT Secrets

```bash
# Rotate the JWT secret
chmod +x vault/scripts/rotate-jwt-secret.sh
./vault/scripts/rotate-jwt-secret.sh
```

### Manual Secret Updates

```bash
# Update JWT secret manually
vault kv put secret/jwt-secret \
  secret="your-new-secret" \
  issuer="PhosHealthcarePlatform" \
  audience="PhosHealthcarePlatformClients" \
  expiry_minutes="60"
```

## Production Deployment

### 1. Update Environment Variables

Copy `env.production.template` to `.env.production` and update:
- Vault server address
- TLS certificates
- Database connection strings
- Domain names

### 2. Secure AppRole Credentials

In production, store AppRole credentials securely:
- Use Kubernetes secrets
- Use cloud secret managers
- Use secure key management systems

### 3. Enable TLS

Configure proper TLS certificates for Vault:
```bash
# Generate certificates
vault write pki/root/generate/internal \
  common_name="vault.your-domain.com" \
  ttl=8760h

# Configure TLS
vault write pki/config/urls \
  issuing_certificates="https://vault.your-domain.com:8200/v1/pki/ca" \
  crl_distribution_points="https://vault.your-domain.com:8200/v1/pki/crl"
```

## Kubernetes Integration

### Using Vault Injector

1. Install Vault Helm chart:
```bash
helm repo add hashicorp https://helm.releases.hashicorp.com
helm install vault hashicorp/vault --set injector.enabled=true
```

2. Annotate your deployment:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: phos-api
spec:
  template:
    metadata:
      annotations:
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/agent-inject-secret-jwt-secret: "secret/jwt-secret"
        vault.hashicorp.com/role: "phos-api-role"
```

3. Vault Injector will automatically:
- Inject Vault Agent as sidecar
- Mount secrets as files
- Handle authentication and renewal

### Using External Secrets Operator

1. Install External Secrets Operator
2. Create SecretStore and ExternalSecret resources
3. Secrets will be automatically synchronized

## Troubleshooting

### Common Issues

1. **Vault Agent not starting**
   - Check AppRole credentials
   - Verify Vault server connectivity
   - Check policy permissions

2. **JWT secret file not found**
   - Verify template syntax
   - Check Vault Agent logs
   - Ensure secret exists in Vault

3. **Application startup failures**
   - Check if secret file exists before app starts
   - Verify file permissions
   - Check application logs

### Debug Commands

```bash
# Check Vault status
vault status

# List secrets
vault kv list secret/

# Check AppRole
vault read auth/approle/role/phos-api-role

# Test policy
vault policy read phos-api-policy

# Check Vault Agent logs
docker logs phos-vault-agent-api
```

## Security Best Practices

1. **Use strong secrets**: Generate cryptographically secure secrets
2. **Rotate regularly**: Implement automated secret rotation
3. **Limit access**: Use least-privilege policies
4. **Audit logging**: Enable Vault audit logging
5. **Network security**: Use TLS and network policies
6. **Backup policies**: Regularly backup Vault configuration

## Monitoring

### Health Checks

- Vault server: `vault status`
- Vault Agent: Check if secret file exists
- Application: `/health` endpoint

### Metrics

Enable Vault telemetry:
```hcl
telemetry {
  prometheus_retention_time = "24h"
  disable_hostname = true
}
```

### Logging

Configure structured logging:
```hcl
log_level = "info"
log_format = "json"
``` 
