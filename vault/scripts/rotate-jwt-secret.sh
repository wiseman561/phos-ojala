#!/bin/bash

# JWT Secret Rotation Script
# This script generates a new JWT secret and updates it in Vault

set -e

# Configuration
VAULT_ADDR=${VAULT_ADDR:-"http://localhost:8200"}
VAULT_TOKEN=${VAULT_TOKEN:-"phos-dev-token"}
SECRET_PATH="secret/jwt-secret"

echo "🔄 Rotating JWT secret..."

# Generate new JWT secret (base64 encoded, 32 bytes)
NEW_SECRET=$(openssl rand -base64 32)

echo "🔑 Generated new JWT secret"

# Update the secret in Vault
vault kv put $SECRET_PATH \
    secret="$NEW_SECRET" \
    issuer="PhosHealthcarePlatform" \
    audience="PhosHealthcarePlatformClients" \
    expiry_minutes="60"

echo "✅ JWT secret rotated successfully!"
echo ""
echo "📋 New secret metadata:"
vault kv metadata get $SECRET_PATH

echo ""
echo "⚠️  Note: Applications using this secret will need to be restarted"
echo "   or will pick up the new secret on their next template refresh."
