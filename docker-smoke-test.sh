#!/bin/bash
# Phos Healthcare Platform - Docker Smoke Test Script

set -e

echo "🐳 Starting Docker Smoke Test for Phos Healthcare Platform..."

# Step 1: Clean up any existing containers
echo "🧹 Cleaning up existing containers..."
docker compose down -v

# Step 2: Build and start all services
echo "🏗️ Building and starting all services..."
docker compose up --build -d

# Step 3: Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Step 4: Check running containers
echo "📋 Checking running containers..."
docker compose ps --filter "status=running"

# Step 5: Health check endpoints
echo "🏥 Testing health endpoints..."

# Function to test endpoint with retries
test_endpoint() {
    local url=$1
    local service_name=$2
    local max_attempts=5
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        echo "Testing $service_name (attempt $attempt/$max_attempts): $url"
        if curl -f -s "$url" > /dev/null 2>&1; then
            echo "✅ $service_name is healthy"
            return 0
        else
            echo "⚠️ $service_name not ready, waiting..."
            sleep 10
            ((attempt++))
        fi
    done

    echo "❌ $service_name failed health check after $max_attempts attempts"
    return 1
}

# Test each service health endpoint
test_endpoint "http://localhost:5001/health" "Identity Service"
test_endpoint "http://localhost:5000/health" "Core API"
test_endpoint "http://localhost:8083/health" "HealthScore Service"
test_endpoint "http://localhost:8200/v1/sys/health" "Vault"
test_endpoint "http://localhost:8086/health" "InfluxDB"

# Step 6: Show container logs for debugging
echo "📋 Container status summary:"
docker compose ps

echo "✅ Docker smoke test completed!"
echo "🔗 Services available at:"
echo "   - Identity Service: http://localhost:5001"
echo "   - Core API: http://localhost:5000"
echo "   - HealthScore: http://localhost:8083"
echo "   - Web UI: http://localhost:3000"
echo "   - Vault UI: http://localhost:8200"
echo "   - Database: localhost:5432"
