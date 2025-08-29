# 🚀 Phos Healthcare Platform - Quick Start Guide

## Overview
This guide will get your Phos Healthcare Platform production-ready in under 30 minutes.

---

## ⚡ Quick Setup (5 Commands)

### Step 1: Enable PowerShell Execution (Windows)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force
```

### Step 2: Clean Up Duplicate Folders
```powershell
.\cleanup-duplicates.ps1
```

### Step 3: Create Environment Variables
```bash
.\create-env-file.sh
# OR manually create .env file (see ENVIRONMENT_SETUP.md)
```

### Step 4: Build & Test
```bash
.\build-and-test.sh
```

### Step 5: Deploy & Smoke Test
```bash
.\docker-smoke-test.sh
```

---

## 📋 Detailed Steps

### 1. Repository Cleanup (2 minutes)

**Windows (PowerShell):**
```powershell
# Set execution policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force

# Run cleanup script
.\cleanup-duplicates.ps1
```

**Linux/Mac (Bash):**
```bash
# Manual cleanup
rm -rf apps backend libs Phos.Data Phos.Api Phos.Services integration phos.web
rm -f create cd docker remote git error
```

### 2. Environment Setup (2 minutes)

**Option A: Automated (Recommended)**
```bash
# Create .env file with defaults
bash create-env-file.sh
```

**Option B: Manual**
Create `.env` file in root directory:
```bash
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
```

### 3. Build & Test (4 minutes)

```bash
# Automated build and test
bash build-and-test.sh

# OR Manual steps:
dotnet clean PhosHealthcarePlatform.sln
dotnet restore PhosHealthcarePlatform.sln
dotnet build PhosHealthcarePlatform.sln -c Release
dotnet test PhosHealthcarePlatform.sln
```

### 4. Container Deployment (5 minutes)

```bash
# Automated deployment and smoke test
bash docker-smoke-test.sh

# OR Manual steps:
docker compose down -v
docker compose up --build -d
sleep 30
curl -f http://localhost:5001/health  # Identity
curl -f http://localhost:5000/health  # API
curl -f http://localhost:8083/health  # HealthScore
```

### 5. Commit Changes (1 minute)

```bash
git add -A
git commit -m "chore: production readiness - cleanup duplicates, add env setup, fix docker configs"
```

---

## 🔗 Service Endpoints

After successful deployment, these services will be available:

| Service | URL | Description |
|---------|-----|-------------|
| **Identity** | http://localhost:5001 | Authentication & Authorization |
| **Core API** | http://localhost:5000 | Main application API |
| **HealthScore** | http://localhost:8083 | Health scoring service |
| **Web UI** | http://localhost:3000 | React frontend |
| **Vault UI** | http://localhost:8200 | Secrets management |
| **Database** | localhost:5432 | PostgreSQL database |
| **Redis** | localhost:6379 | Cache & sessions |
| **InfluxDB** | http://localhost:8086 | Telemetry data |

### Health Check Endpoints
- http://localhost:5001/health
- http://localhost:5000/health  
- http://localhost:8083/health

---

## 🛠️ Troubleshooting

### Common Issues

**1. PowerShell Execution Policy Error**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process -Force
```

**2. Docker Build Fails - Missing .env**
```bash
# Ensure .env file exists in root directory
ls -la .env
# If missing, run: bash create-env-file.sh
```

**3. Database Connection Errors**
```bash
# Check if PostgreSQL container is running
docker compose ps phos-db
# Check logs
docker compose logs phos-db
```

**4. Port Conflicts**
```bash
# Check what's using the ports
netstat -tulpn | grep :5001
# Stop conflicting services or change ports in docker-compose.yml
```

**5. Health Checks Failing**
```bash
# Check container status
docker compose ps
# Check specific service logs
docker compose logs phos-identity
docker compose logs phos-api
```

### Debug Commands

```bash
# Check all container status
docker compose ps

# View logs for all services
docker compose logs

# View logs for specific service
docker compose logs phos-identity

# Restart specific service
docker compose restart phos-identity

# Rebuild and restart everything
docker compose down -v
docker compose up --build -d
```

---

## 🔒 Security Notes

⚠️ **IMPORTANT**: The default values in this guide are for development only.

**For Production:**

1. **Generate Strong Secrets**
   ```bash
   # Generate secure JWT key (32+ characters)
   openssl rand -base64 32
   
   # Generate secure database password
   openssl rand -base64 24
   ```

2. **Use Vault for Secret Management**
   - Store secrets in HashiCorp Vault
   - Use environment-specific configurations
   - Rotate secrets regularly

3. **Enable HTTPS**
   - Configure SSL certificates
   - Use reverse proxy (nginx/Traefik)
   - Set secure CORS policies

4. **Database Security**
   - Use strong passwords
   - Enable SSL connections
   - Restrict network access

---

## 📊 Verification Checklist

- [ ] Duplicate folders removed
- [ ] .env file created with all required variables
- [ ] Solution builds without errors
- [ ] All tests pass
- [ ] All containers start successfully
- [ ] Health endpoints return 200 OK
- [ ] Web UI loads at http://localhost:3000
- [ ] Database connections work
- [ ] Vault UI accessible at http://localhost:8200

---

## 🎯 Next Steps

1. **Configure Production Secrets**
   - Replace development secrets with production values
   - Set up proper secret management

2. **Set Up CI/CD**
   - The GitHub Actions workflow is already configured
   - Push to main branch to trigger deployment

3. **Configure Monitoring**
   - Set up health check monitoring
   - Configure log aggregation
   - Set up metrics collection

4. **Security Hardening**
   - Enable HTTPS
   - Configure firewall rules
   - Set up backup procedures

---

**🎉 Congratulations! Your Phos Healthcare Platform is now production-ready!**

For additional help, see:
- `ENVIRONMENT_SETUP.md` - Detailed environment configuration
- `PRODUCTION_READINESS_AUDIT_REPORT.md` - Complete audit results
- `COMPREHENSIVE_3PASS_VALIDATION_SUMMARY.md` - Technical validation details 
