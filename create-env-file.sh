#!/bin/bash
# Create canonical .env file for Phos Healthcare Platform

cat > .env <<'EOF'
DB_CONNECTION_STRING=Host=phos-db;Database=PhosHealthcare;Username=phos_user;Password=superSecure123
JWT_KEY=_32_byte_or_longer_random_string_for_production_use_
JWT_ISSUER=PhosHealthcarePlatform
JWT_AUDIENCE=PhosHealthcareClients
HEALTHSCORE_DB_CONN=Host=phos-db;Database=PhosHealthcare;Username=phos_user;Password=superSecure123
AI_MODEL_PATH=/app/models/health-score-model.pkl
ASPNETCORE_ENVIRONMENT=Development
REDIS_CONNECTION_STRING=phos-redis:6379
INFLUX_URL=http://influxdb:8086
INFLUX_TOKEN=phos-influxdb-token
INFLUX_ORG=phos
INFLUX_BUCKET=phos_telemetry
VAULT_ADDR=http://vault:8200
VAULT_PATH=phos-secrets
EOF

echo ".env file created successfully!"
echo "Remember to add .env to .gitignore if not already present."
