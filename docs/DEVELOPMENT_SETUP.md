# 🛠 Development Setup Guide

## Overview

This guide provides a complete development setup for the Ojala Healthcare Platform that eliminates Docker build issues and provides hot reload for backend services.

## 🚀 Quick Start

### 1. Verify Setup
```bash
# Check that everything is ready
./scripts/dev-verify-setup.sh
```

### 2. Start Backend Services
```bash
# Start Redis/Postgres in Docker + backend services with hot reload
./scripts/dev-start-backend.sh
```

### 3. Test Event-Driven Architecture
```bash
# Test the complete patient registration flow
./scripts/dev-test-patient-flow.sh
```

## 📁 Files Created

### Docker Compose
- `docker-compose.dev.yml` - Optimized development compose file
  - Only includes Redis and PostgreSQL
  - No frontend services
  - Uses volumes for data persistence

### Scripts
- `scripts/dev-start-backend.sh` - Starts infrastructure and backend services
- `scripts/dev-test-patient-flow.sh` - Tests complete patient flow
- `scripts/dev-verify-setup.sh` - Verifies development environment

### Configuration
- `.dockerignore` - Prevents large file transfers during builds
- Updated `README.md` - Added development section

## 🏗 Architecture

### Infrastructure (Docker)
- **Redis**: `localhost:6379` - Event bus for inter-service communication
- **PostgreSQL**: `localhost:5432` - Database for all services

### Backend Services (Local with Hot Reload)
- **Identity API**: `http://localhost:5501` - User authentication and registration
- **Main API**: `http://localhost:8080` - Core business logic and patient management

### Frontend Applications (Separate)
- **MD Dashboard**: `http://localhost:3000` - Physician interface
- **Patient Portal**: `http://localhost:3001` - Patient interface
- **RN Dashboard**: `http://localhost:3002` - Nurse interface

## 🔄 Event-Driven Flow

1. **User Registration**: Patient registers via Identity API
2. **Event Publishing**: Identity service publishes `UserRegisteredEvent` to Redis
3. **Event Consumption**: API service subscribes and creates patient record
4. **Verification**: Patient appears in MD Dashboard

## 🛠 Development Workflow

### Starting Development
```bash
# 1. Start infrastructure
docker-compose -f docker-compose.dev.yml up -d

# 2. Start backend services (in separate terminals)
cd src/backend/Ojala.Identity && dotnet watch run
cd src/backend/Ojala.Api && dotnet watch run

# 3. Start frontend (in separate terminals)
cd src/frontend/md-dashboard && npm run dev
cd src/frontend/Ojala.PatientPortal && npm start
```

### Testing
```bash
# Test complete flow
./scripts/dev-test-patient-flow.sh

# Test individual components
curl http://localhost:5501/health  # Identity health check
curl http://localhost:8080/health  # API health check
docker exec ojala-redis-dev redis-cli ping  # Redis test
```

### Monitoring
```bash
# Monitor Redis events
docker exec ojala-redis-dev redis-cli monitor

# View service logs
docker logs ojala-redis-dev
docker logs ojala-db-dev

# Check running containers
docker ps
```

## 🎯 Benefits

### Performance
- ✅ **Fast startup**: No Docker builds required
- ✅ **Hot reload**: Instant code changes
- ✅ **Resource efficient**: Minimal Docker overhead

### Development Experience
- ✅ **Better debugging**: Direct access to logs and debugging
- ✅ **Flexible**: Easy to modify and test individual services
- ✅ **Isolated**: Frontend and backend can be developed independently

### Maintainability
- ✅ **Long-term**: Uses standard development practices
- ✅ **Scalable**: Easy to add new services
- ✅ **Reliable**: Eliminates Docker build issues

## 🔧 Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using a port
lsof -i :5501
lsof -i :8080

# Kill process using port
kill -9 <PID>
```

#### Docker Issues
```bash
# Restart Docker containers
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d

# Clear Docker cache
docker system prune -a
```

#### .NET Issues
```bash
# Clear .NET cache
dotnet clean
dotnet restore

# Check .NET version
dotnet --version
```

### Service Status

#### Check All Services
```bash
./scripts/dev-verify-setup.sh
```

#### Manual Checks
```bash
# Docker containers
docker ps

# Redis
docker exec ojala-redis-dev redis-cli ping

# PostgreSQL
docker exec ojala-db-dev pg_isready -U postgres

# Identity API
curl http://localhost:5501/health

# Main API
curl http://localhost:8080/health
```

## 📊 Monitoring and Logs

### Service Logs
```bash
# Redis logs
docker logs ojala-redis-dev

# PostgreSQL logs
docker logs ojala-db-dev

# Backend logs (in terminal where services are running)
# Identity and API logs appear in their respective terminals
```

### Event Monitoring
```bash
# Monitor all Redis events
docker exec ojala-redis-dev redis-cli monitor

# Monitor specific channel
docker exec ojala-redis-dev redis-cli subscribe events:userregisteredevent
```

### Database Access
```bash
# Connect to PostgreSQL
docker exec -it ojala-db-dev psql -U postgres -d ojala

# List tables
\dt

# Query patients
SELECT * FROM "Patients";
```

## 🚀 Production Deployment

### Docker Build (For Production)
```bash
# Build optimized images
docker-compose -f docker-compose.event-driven.yml build

# Deploy to production
docker-compose -f docker-compose.event-driven.yml up -d
```

### Kubernetes Deployment
```bash
# Apply Kubernetes manifests
kubectl apply -f charts/

# Check deployment status
kubectl get pods
kubectl get services
```

## 📚 Additional Resources

### Documentation
- [Event-Driven Architecture](./EVENT_DRIVEN_ARCHITECTURE.md)
- [Docker Troubleshooting](./DOCKER_TROUBLESHOOTING.md)
- [API Documentation](./healthscore-api.yaml)

### Scripts Reference
- `./scripts/dev-start-backend.sh` - Start development environment
- `./scripts/dev-test-patient-flow.sh` - Test patient registration flow
- `./scripts/dev-verify-setup.sh` - Verify development setup
- `./scripts/test-event-driven-only.sh` - Test event-driven architecture
- `./scripts/test-end-to-end-flow.sh` - End-to-end testing

### Environment Variables
```bash
# Identity Service
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://localhost:5501
ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=ojala;Username=postgres;Password=postgres
ConnectionStrings__Redis=localhost:6379

# API Service
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://localhost:8080
ConnectionStrings__DefaultConnection=Host=localhost;Port=5432;Database=ojala;Username=postgres;Password=postgres
ConnectionStrings__Redis=localhost:6379
IdentityServer__Authority=http://localhost:5501
```

## ✅ Success Criteria

The development environment is working correctly when:

- ✅ Redis and PostgreSQL containers are running
- ✅ Identity API responds on port 5501
- ✅ Main API responds on port 8080
- ✅ User registration creates events in Redis
- ✅ Patient records are created automatically
- ✅ Frontend applications can connect to APIs
- ✅ Hot reload works for backend services

## 🎉 Summary

This development setup provides:

1. **Eliminated Docker build issues** by using local development
2. **Hot reload** for instant code changes
3. **Event-driven architecture** testing
4. **Comprehensive tooling** for development and testing
5. **Production-ready** deployment options

The setup is designed for long-term maintainability and provides an excellent development experience while maintaining the robustness of the event-driven architecture. 
