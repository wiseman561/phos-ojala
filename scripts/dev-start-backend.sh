#!/bin/bash

# Development Backend Startup Script
# Starts Redis/Postgres in Docker and runs backend services with hot reload

set -e

echo "🚀 Starting Ojala Backend Development Environment"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "${BLUE}📋 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if Docker is running
check_docker() {
    print_step "Checking Docker..."
    if docker info > /dev/null 2>&1; then
        print_success "Docker is running"
        return 0
    else
        print_error "Docker is not running"
        return 1
    fi
}

# Function to check if .NET SDK is installed
check_dotnet() {
    print_step "Checking .NET SDK..."
    if command -v dotnet > /dev/null 2>&1; then
        local version=$(dotnet --version)
        print_success ".NET SDK $version is installed"
        return 0
    else
        print_error ".NET SDK is not installed"
        return 1
    fi
}

# Function to start infrastructure services
start_infrastructure() {
    print_step "Starting infrastructure services (Redis & PostgreSQL)..."

    # Stop any existing containers
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true

    # Start Redis and PostgreSQL
    if docker-compose -f docker-compose.dev.yml up -d ojala-redis ojala-db; then
        print_success "Infrastructure services started"

        # Wait for services to be ready
        print_step "Waiting for services to be ready..."
        sleep 10

        # Test Redis connection
        if docker exec ojala-redis-dev redis-cli ping > /dev/null 2>&1; then
            print_success "Redis is ready"
        else
            print_error "Redis is not responding"
            return 1
        fi

        # Test PostgreSQL connection
        if docker exec ojala-db-dev pg_isready -U postgres > /dev/null 2>&1; then
            print_success "PostgreSQL is ready"
        else
            print_error "PostgreSQL is not responding"
            return 1
        fi
    else
        print_error "Failed to start infrastructure services"
        return 1
    fi

    return 0
}

# Function to run database migrations
run_migrations() {
    print_step "Running database migrations..."

    # Run Identity migrations
    cd src/backend/Ojala.Identity
    if dotnet ef database update --no-build; then
        print_success "Identity migrations completed"
    else
        print_warning "Identity migrations failed (may already be up to date)"
    fi

    # Run API migrations
    cd ../Ojala.Api
    if dotnet ef database update --no-build; then
        print_success "API migrations completed"
    else
        print_warning "API migrations failed (may already be up to date)"
    fi

    cd ../../..
}

# Function to start backend services with hot reload
start_backend_services() {
    print_step "Starting backend services with hot reload..."

    # Create a temporary script for running services in parallel
    cat > /tmp/start-backend-services.sh << 'EOF'
#!/bin/bash

# Function to start Identity service
start_identity() {
    echo "🆔 Starting Identity service..."
    cd src/backend/Ojala.Identity
    export ASPNETCORE_ENVIRONMENT=Development
    export ASPNETCORE_URLS=http://localhost:5501
    export ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=ojala;Username=postgres;Password=postgres"
    export ConnectionStrings__Redis="localhost:6379"
    export Jwt__Key="super-secret-jwt-key-for-development"
    export Jwt__Issuer="ojala-identity"
    export Jwt__Audience="ojala-api"

    dotnet watch run --no-hot-reload
}

# Function to start API service
start_api() {
    echo "🔌 Starting API service..."
    cd src/backend/Ojala.Api
    export ASPNETCORE_ENVIRONMENT=Development
    export ASPNETCORE_URLS=http://localhost:8080
    export ConnectionStrings__DefaultConnection="Host=localhost;Port=5432;Database=ojala;Username=postgres;Password=postgres"
    export ConnectionStrings__Redis="localhost:6379"
    export IdentityServer__Authority="http://localhost:5501"

    dotnet watch run --no-hot-reload
}

# Start both services in parallel
start_identity &
IDENTITY_PID=$!

start_api &
API_PID=$!

# Function to handle cleanup
cleanup() {
    echo ""
    echo "🛑 Shutting down backend services..."
    kill $IDENTITY_PID 2>/dev/null || true
    kill $API_PID 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
EOF

    chmod +x /tmp/start-backend-services.sh

    print_success "Backend services script created"
    print_step "Starting Identity and API services in parallel..."

    # Run the services
    /tmp/start-backend-services.sh
}

# Function to show service status
show_status() {
    echo ""
    echo "📊 Service Status"
    echo "================="
    echo "🟢 Infrastructure Services:"
    echo "  • Redis: localhost:6379"
    echo "  • PostgreSQL: localhost:5432"
    echo ""
    echo "🟡 Backend Services:"
    echo "  • Identity API: http://localhost:5501"
    echo "  • Main API: http://localhost:8080"
    echo ""
    echo "🔗 Useful URLs:"
    echo "  • Identity Swagger: http://localhost:5501/swagger"
    echo "  • API Swagger: http://localhost:8080/swagger"
    echo "  • Health Check: http://localhost:8080/health"
    echo ""
    echo "📝 Development Commands:"
    echo "  • Test patient flow: ./scripts/dev-test-patient-flow.sh"
    echo "  • Monitor Redis: docker exec ojala-redis-dev redis-cli monitor"
    echo "  • View logs: docker logs ojala-redis-dev"
    echo ""
}

# Function to check if services are running
check_services() {
    print_step "Checking service status..."

    # Check Redis
    if docker exec ojala-redis-dev redis-cli ping > /dev/null 2>&1; then
        print_success "Redis is running"
    else
        print_error "Redis is not running"
    fi

    # Check PostgreSQL
    if docker exec ojala-db-dev pg_isready -U postgres > /dev/null 2>&1; then
        print_success "PostgreSQL is running"
    else
        print_error "PostgreSQL is not running"
    fi

    # Check Identity service
    if curl -s http://localhost:5501/health > /dev/null 2>&1; then
        print_success "Identity service is running"
    else
        print_warning "Identity service is not responding (may still be starting)"
    fi

    # Check API service
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        print_success "API service is running"
    else
        print_warning "API service is not responding (may still be starting)"
    fi
}

# Main function
main() {
    print_step "Initializing development environment..."

    # Check prerequisites
    if ! check_docker; then
        print_error "Docker is required. Please start Docker Desktop."
        exit 1
    fi

    if ! check_dotnet; then
        print_error ".NET SDK is required. Please install .NET 8.0 SDK."
        exit 1
    fi

    # Start infrastructure
    if ! start_infrastructure; then
        print_error "Failed to start infrastructure. Exiting."
        exit 1
    fi

    # Run migrations
    run_migrations

    # Show status
    show_status

    # Check initial service status
    check_services

    echo ""
    print_success "Development environment is ready!"
    print_step "Starting backend services with hot reload..."
    print_warning "Press Ctrl+C to stop all services"

    # Start backend services
    start_backend_services
}

# Run the main function
main "$@"
