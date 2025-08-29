# Vault Policy for Phos API Service
# This policy defines permissions for the Phos.Api service

# Allow reading database credentials
path "phos/kv/data/database/connection" {
  capabilities = ["read"]
}

# Allow reading JWT configuration
path "phos/kv/data/jwt" {
  capabilities = ["read"]
}

# Allow reading API keys and service credentials
path "phos/kv/data/api-keys/*" {
  capabilities = ["read"]
}

# Allow database credential generation
path "phos/database/creds/api-role" {
  capabilities = ["read"]
}

# Allow AWS credential generation for S3 access
path "phos/aws/creds/s3-access" {
  capabilities = ["read"]
}

# Allow token creation for service-to-service communication
path "auth/token/create" {
  capabilities = ["create", "update"]
}

# Allow token renewal
path "auth/token/renew" {
  capabilities = ["update"]
}

# Allow token lookup for validation
path "auth/token/lookup" {
  capabilities = ["read"]
}
