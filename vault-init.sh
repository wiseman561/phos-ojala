#!/bin/sh

# Set the Vault address
export VAULT_ADDR=http://localhost:8200

# Wait until Vault is up
until curl -s http://localhost:8200/v1/sys/health > /dev/null; do
  echo "Waiting for Vault to become available..."
  sleep 2
done

# Authenticate using dev root token
vault login $VAULT_DEV_ROOT_TOKEN_ID

# Enable the KV secrets engine
vault secrets enable -path=secret kv

# Write a secret for the device gateway
vault kv put secret/device-gateway VAULT_TOKEN=phos-internal-token

echo "✅ Vault initialized successfully and secrets are in place."
