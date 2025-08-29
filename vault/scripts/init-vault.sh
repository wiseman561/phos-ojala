#!/bin/bash

# Vault initialization script for Phos API
# This script sets up Vault with JWT secrets and AppRole authentication

set -e

# Configuration
VAULT_ADDR=${VAULT_ADDR:-"http://localhost:8200"}
VAULT_TOKEN=${VAULT_TOKEN:-"phos-dev-token"}
SECRET_PATH="secret/jwt-secret"
POLICY_NAME="phos-api-policy"
ROLE_NAME="phos-api-role"

echo "🔐 Initializing Vault for Phos API..."

# Wait for Vault to be ready
echo "⏳ Waiting for Vault to be ready..."
until vault status > /dev/null 2>&1; do
    echo "Vault not ready, waiting..."
    sleep 2
done

echo "✅ Vault is ready!"

# Enable KV secrets engine if not already enabled
echo "📦 Enabling KV secrets engine..."
vault secrets enable -path=secret kv-v2 2>/dev/null || echo "KV secrets engine already enabled"

# Create JWT secret
echo "🔑 Creating JWT secret..."
vault kv put $SECRET_PATH \
    secret="Z4tccK0JGnd7MwnUVTstw4jl0MXeRcIyi50SQFnPh0E=" \
    issuer="PhosHealthcarePlatform" \
    audience="PhosHealthcarePlatformClients" \
    expiry_minutes="60"

echo "✅ JWT secret created at $SECRET_PATH"

# Create policy
echo "📋 Creating Vault policy..."
vault policy write $POLICY_NAME vault/policies/phos-api-policy.hcl

echo "✅ Policy '$POLICY_NAME' created"

# Enable AppRole auth method
echo "🔐 Enabling AppRole authentication..."
vault auth enable approle 2>/dev/null || echo "AppRole auth method already enabled"

# Create AppRole
echo "👤 Creating AppRole..."
vault write auth/approle/role/$ROLE_NAME \
    token_policies=$POLICY_NAME \
    token_ttl=1h \
    token_max_ttl=4h

echo "✅ AppRole '$ROLE_NAME' created"

# Get Role ID
echo "🆔 Getting Role ID..."
ROLE_ID=$(vault read -format=json auth/approle/role/$ROLE_NAME/role-id | jq -r '.data.role_id')
echo $ROLE_ID > vault/role-id
echo "✅ Role ID saved to vault/role-id"

# Generate Secret ID
echo "🔒 Generating Secret ID..."
SECRET_ID=$(vault write -format=json -f auth/approle/role/$ROLE_NAME/secret-id | jq -r '.data.secret_id')
echo $SECRET_ID > vault/secret-id
echo "✅ Secret ID saved to vault/secret-id"

# Set proper permissions
chmod 600 vault/role-id vault/secret-id

echo "🎉 Vault initialization complete!"
echo ""
echo "📋 Summary:"
echo "  - JWT Secret: $SECRET_PATH"
echo "  - Policy: $POLICY_NAME"
echo "  - AppRole: $ROLE_NAME"
echo "  - Role ID: vault/role-id"
echo "  - Secret ID: vault/secret-id"
echo ""
echo "🚀 You can now start the application with:"
echo "   docker-compose up"
