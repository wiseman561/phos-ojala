# 🌍 Phos Healthcare Platform - Environment Setup Guide

## Required Environment Variables

The Phos Healthcare Platform requires the following environment variables to be set for proper operation:

### Database Configuration
```bash
DB_CONNECTION_STRING=Server=phos-db;Database=PhosHealthcare;User Id=phos_user;Password=secure_password_123;TrustServerCertificate=true;
DB_USER=phos_user
DB_PASSWORD=secure_password_123
DB_NAME=PhosHealthcare
```

### JWT Configuration
```bash
JWT_KEY=your-super-secure-jwt-key-256-bits-minimum-for-production-use
JWT_ISSUER=PhosHealthcarePlatform
JWT_AUDIENCE=PhosHealthcarePlatformClients
```

### Health Score Service Configuration
```bash
HEALTHSCORE_DB_CONN=Server=phos-db;Database=PhosHealthcare;User Id=phos_user;Password=secure_password_123;TrustServerCertificate=true;
AI_MODEL_PATH=/app/models/health-score-model.pkl
```

### Vault Configuration (optional - defaults provided)
```bash
VAULT_ADDR=http://vault:8200
VAULT_PATH=phos-secrets
# VAULT_TOKEN=<optional-for-dev>
# VAULT_K8S_ROLE=<service-specific>
```

### ASP.NET Core Configuration
```bash
ASPNETCORE_ENVIRONMENT=Development
```

### Redis Configuration
```bash
REDIS_CONNECTION_STRING=phos-redis:6379
```

### InfluxDB Configuration (for telemetry)
```bash
INFLUX_URL=http://influxdb:8086
INFLUX_TOKEN=phos-influxdb-token
INFLUX_ORG=phos
INFLUX_BUCKET=phos_telemetry
```

## Setup Instructions

### Option 1: Create .env File
Create a `.env` file in the root directory with the above variables:

```bash
# Copy the variables above into a .env file
echo "DB_CONNECTION_STRING=Server=phos-db;Database=PhosHealthcare;User Id=phos_user;Password=secure_password_123;TrustServerCertificate=true;" > .env
echo "DB_USER=phos_user" >> .env
echo "DB_PASSWORD=secure_password_123" >> .env
echo "DB_NAME=PhosHealthcare" >> .env
# ... continue with other variables
```

### Option 2: Export Environment Variables
```bash
export DB_CONNECTION_STRING="Server=phos-db;Database=PhosHealthcare;User Id=phos_user;Password=secure_password_123;TrustServerCertificate=true;"
export DB_USER="phos_user"
export DB_PASSWORD="secure_password_123"
export DB_NAME="PhosHealthcare"
export JWT_KEY="your-super-secure-jwt-key-256-bits-minimum-for-production-use"
export JWT_ISSUER="PhosHealthcarePlatform"
export JWT_AUDIENCE="PhosHealthcarePlatformClients"
export HEALTHSCORE_DB_CONN="Server=phos-db;Database=PhosHealthcare;User Id=phos_user;Password=secure_password_123;TrustServerCertificate=true;"
export AI_MODEL_PATH="/app/models/health-score-model.pkl"
export ASPNETCORE_ENVIRONMENT="Development"
export REDIS_CONNECTION_STRING="phos-redis:6379"
export INFLUX_URL="http://influxdb:8086"
export INFLUX_TOKEN="phos-influxdb-token"
export INFLUX_ORG="phos"
export INFLUX_BUCKET="phos_telemetry"
```

### Option 3: PowerShell (Windows)
```powershell
$env:DB_CONNECTION_STRING="Server=phos-db;Database=PhosHealthcare;User Id=phos_user;Password=secure_password_123;TrustServerCertificate=true;"
$env:DB_USER="phos_user"
$env:DB_PASSWORD="secure_password_123"
$env:DB_NAME="PhosHealthcare"
$env:JWT_KEY="your-super-secure-jwt-key-256-bits-minimum-for-production-use"
$env:JWT_ISSUER="PhosHealthcarePlatform"
$env:JWT_AUDIENCE="PhosHealthcarePlatformClients"
$env:HEALTHSCORE_DB_CONN="Server=phos-db;Database=PhosHealthcare;User Id=phos_user;Password=secure_password_123;TrustServerCertificate=true;"
$env:AI_MODEL_PATH="/app/models/health-score-model.pkl"
$env:ASPNETCORE_ENVIRONMENT="Development"
$env:REDIS_CONNECTION_STRING="phos-redis:6379"
$env:INFLUX_URL="http://influxdb:8086"
$env:INFLUX_TOKEN="phos-influxdb-token"
$env:INFLUX_ORG="phos"
$env:INFLUX_BUCKET="phos_telemetry"
```

## Security Notes

⚠️ **IMPORTANT**: The values shown above are for development only.

For production environments:
1. **Generate strong, unique secrets** for JWT keys and database passwords
2. **Use a proper secret management system** like HashiCorp Vault
3. **Never commit secrets to version control**
4. **Rotate secrets regularly**
5. **Use environment-specific configurations**

## Verification

After setting the environment variables, you can verify they're set correctly:

```bash
# Check if variables are set
echo $DB_CONNECTION_STRING
echo $JWT_KEY
# ... etc
```

Or in PowerShell:
```powershell
echo $env:DB_CONNECTION_STRING
echo $env:JWT_KEY
# ... etc
``` 
