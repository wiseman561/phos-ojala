# Vault Policy for Phos Web Application
# This policy defines permissions for the Phos.Web frontend application

# Allow reading frontend configuration
path "phos/kv/data/web-config/*" {
  capabilities = ["read"]
}

# Allow reading API keys for external services
path "phos/kv/data/api-keys/frontend/*" {
  capabilities = ["read"]
}

# Allow reading feature flags
path "phos/kv/data/feature-flags/*" {
  capabilities = ["read"]
}

# Allow token renewal
path "auth/token/renew" {
  capabilities = ["update"]
}

# Allow token lookup for validation
path "auth/token/lookup" {
  capabilities = ["read"]
}

# Deny access to sensitive backend credentials
path "phos/kv/data/database/*" {
  capabilities = ["deny"]
}

# Deny access to backend service credentials
path "phos/database/creds/*" {
  capabilities = ["deny"]
}
