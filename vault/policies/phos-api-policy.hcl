# Policy for Phos API to read JWT secrets
path "secret/data/jwt-secret" {
  capabilities = ["read"]
}

# Allow reading metadata for secret rotation
path "secret/metadata/jwt-secret" {
  capabilities = ["read"]
}

# Allow listing secrets (for discovery)
path "secret/metadata/*" {
  capabilities = ["list"]
}
