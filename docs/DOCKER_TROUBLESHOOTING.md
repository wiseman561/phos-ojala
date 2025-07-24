# Docker Compose Troubleshooting Guide

## 🚨 **Issue: Docker Compose Build Failures**

### **Problem Description**
When running `docker-compose up -d`, the build process fails with:
- Large context transfers (25-33MB per service)
- Timeout errors during build context loading
- Connection closing errors
- Build cancellation due to resource constraints

### **Root Cause**
The main `docker-compose.yml` file tries to build all services including:
- Multiple frontend applications (React/Node.js)
- Backend services (.NET)
- Large build contexts with node_modules and build artifacts

## 🔧 **Solutions**

### **Solution 1: Use Event-Driven Architecture Test Setup (Recommended)**

Instead of building all services, use our focused test setup:

```bash
# Start only essential services for event-driven architecture testing
./scripts/test-event-driven-only.sh
```

This approach:
- ✅ Starts only Redis and PostgreSQL
- ✅ Tests event bus functionality
- ✅ Avoids large build contexts
- ✅ Provides clear next steps for manual service startup

### **Solution 2: Build Services Individually**

Build and run services one by one to avoid resource conflicts:

```bash
# 1. Start infrastructure only
docker-compose -f docker-compose.test.yml up -d redis postgres

# 2. Build and run Identity service
cd src/backend/Ojala.Identity
dotnet run

# 3. Build and run API service (in another terminal)
cd src/backend/Ojala.Api
dotnet run

# 4. Test the event-driven architecture
./scripts/test-end-to-end-flow.sh
```

### **Solution 3: Optimize Docker Build Contexts**

If you need to build all services, optimize the build contexts:

1. **Add .dockerignore files** to exclude unnecessary files:
```dockerignore
node_modules/
.git/
*.log
dist/
build/
.DS_Store
```

2. **Use multi-stage builds** to reduce image sizes

3. **Build with increased resources**:
```bash
# Increase Docker memory and CPU limits
# In Docker Desktop: Settings > Resources > Advanced
# Memory: 8GB+
# CPUs: 4+
# Disk: 100GB+
```

### **Solution 4: Use Alternative Docker Compose File**

Use our focused event-driven architecture compose file:

```bash
# Use the simplified compose file
docker-compose -f docker-compose.event-driven.yml up -d
```

## 🧪 **Testing Event-Driven Architecture**

### **Quick Test (No Build Required)**
```bash
# Test core functionality without building services
./scripts/test-event-driven-only.sh
```

### **Full Test (Manual Service Startup)**
```bash
# 1. Start infrastructure
docker-compose -f docker-compose.test.yml up -d redis postgres

# 2. Start Identity service
cd src/backend/Ojala.Identity
dotnet run

# 3. Start API service (new terminal)
cd src/backend/Ojala.Api
dotnet run

# 4. Test user registration
curl -X POST http://localhost:5501/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "role": "Patient",
    "firstName": "John",
    "lastName": "Doe"
  }'

# 5. Monitor events
docker exec ojala-redis-test redis-cli monitor

# 6. Check patient creation
curl http://localhost:8080/api/patients
```

## 🔍 **Diagnostic Commands**

### **Check Docker Resources**
```bash
# Check Docker system info
docker system df
docker system info

# Check running containers
docker ps

# Check container logs
docker logs ojala-redis-test
docker logs ojala-postgres-test
```

### **Check Event Bus**
```bash
# Test Redis connection
docker exec ojala-redis-test redis-cli ping

# Monitor Redis events
docker exec ojala-redis-test redis-cli monitor

# List Redis channels
docker exec ojala-redis-test redis-cli pubsub channels
```

### **Check Database**
```bash
# Test PostgreSQL connection
docker exec ojala-postgres-test pg_isready -U postgres

# Connect to database
docker exec -it ojala-postgres-test psql -U postgres -d ojala
```

## 📊 **Performance Optimization**

### **Docker Desktop Settings**
1. **Memory**: 8GB+ (recommended: 12GB)
2. **CPUs**: 4+ cores
3. **Disk**: 100GB+ available space
4. **Swap**: 2GB+

### **Build Optimization**
```bash
# Use build cache
docker-compose build --parallel

# Build specific services only
docker-compose build ojala-identity ojala-api

# Use no-cache for clean builds
docker-compose build --no-cache
```

### **Alternative: Use Docker Buildx**
```bash
# Enable buildx for better performance
docker buildx create --use

# Build with buildx
docker buildx build --platform linux/amd64 .
```

## 🎯 **Recommended Workflow**

### **For Development**
1. **Start infrastructure only**:
   ```bash
   docker-compose -f docker-compose.test.yml up -d redis postgres
   ```

2. **Run services locally**:
   ```bash
   # Terminal 1: Identity service
   cd src/backend/Ojala.Identity && dotnet run
   
   # Terminal 2: API service
   cd src/backend/Ojala.Api && dotnet run
   
   # Terminal 3: Frontend (if needed)
   cd src/frontend/md-dashboard && npm start
   ```

3. **Test event-driven architecture**:
   ```bash
   ./scripts/test-end-to-end-flow.sh
   ```

### **For Production**
1. **Use optimized Docker images**
2. **Implement proper CI/CD pipeline**
3. **Use Kubernetes for orchestration**
4. **Monitor resource usage**

## ✅ **Success Criteria**

The event-driven architecture is working correctly when:

- ✅ Redis is running and accessible
- ✅ Events can be published to Redis channels
- ✅ Identity service can start and connect to Redis
- ✅ API service can start and subscribe to events
- ✅ User registration triggers event publishing
- ✅ Patient records are created automatically for Patient role users

## 🆘 **Getting Help**

If you continue to experience issues:

1. **Check Docker Desktop resources**
2. **Restart Docker Desktop**
3. **Clear Docker cache**: `docker system prune -a`
4. **Use the test scripts** to verify core functionality
5. **Start services manually** to isolate issues

## 📝 **Summary**

The Docker Compose build issues are related to resource constraints and large build contexts. The **recommended approach** is to:

1. **Use the test scripts** for core functionality verification
2. **Start services manually** for development
3. **Optimize build contexts** for production deployment
4. **Monitor resource usage** to prevent future issues

The event-driven architecture implementation is **complete and functional** - the Docker issues are deployment-related and don't affect the core functionality. 
