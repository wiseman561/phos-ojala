#!/bin/bash

# Development Setup Verification Script
# Tests that the development environment is properly configured

set -e

echo "🔍 Verifying Development Setup"
echo "=============================="

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

# Function to check Docker containers
check_docker_containers() {
    print_step "Checking Docker containers..."

    # Check if containers are running
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "phos-redis-dev.*Up"; then
        print_success "Redis container is running"
    else
        print_error "Redis container is not running"
        return 1
    fi

    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "phos-db-dev.*Up"; then
        print_success "PostgreSQL container is running"
    else
        print_error "PostgreSQL container is not running"
        return 1
    fi

    return 0
}

# Function to test Redis connection
test_redis() {
    print_step "Testing Redis connection..."

    if docker exec phos-redis-dev redis-cli ping | grep -q "PONG"; then
        print_success "Redis is responding"
        return 0
    else
        print_error "Redis is not responding"
        return 1
    fi
}

# Function to test PostgreSQL connection
test_postgresql() {
    print_step "Testing PostgreSQL connection..."

    if docker exec phos-db-dev pg_isready -U postgres > /dev/null 2>&1; then
        print_success "PostgreSQL is responding"
        return 0
    else
        print_error "PostgreSQL is not responding"
        return 1
    fi
}

# Function to check .NET SDK
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

# Function to check backend projects
check_backend_projects() {
    print_step "Checking backend projects..."

    if [ -d "src/backend/Phos.Identity" ]; then
        print_success "Phos.Identity project exists"
    else
        print_error "Phos.Identity project not found"
        return 1
    fi

    if [ -d "src/backend/Phos.Api" ]; then
        print_success "Phos.Api project exists"
    else
        print_error "Phos.Api project not found"
        return 1
    fi

    return 0
}

# Function to test port availability
test_ports() {
    print_step "Testing port availability..."

    # Test Redis port
    if nc -z localhost 6379 2>/dev/null; then
        print_success "Port 6379 (Redis) is available"
    else
        print_error "Port 6379 (Redis) is not available"
        return 1
    fi

    # Test PostgreSQL port
    if nc -z localhost 5432 2>/dev/null; then
        print_success "Port 5432 (PostgreSQL) is available"
    else
        print_error "Port 5432 (PostgreSQL) is not available"
        return 1
    fi

    # Test Identity API port (should be free)
    if ! nc -z localhost 5501 2>/dev/null; then
        print_success "Port 5501 (Identity API) is available"
    else
        print_warning "Port 5501 (Identity API) is already in use"
    fi

    # Test Main API port (should be free)
    if ! nc -z localhost 8080 2>/dev/null; then
        print_success "Port 8080 (Main API) is available"
    else
        print_warning "Port 8080 (Main API) is already in use"
    fi

    return 0
}

# Function to show next steps
show_next_steps() {
    echo ""
    echo "🚀 Next Steps"
    echo "============="
    echo ""
    echo "1. Start backend services with hot reload:"
    echo "   ./scripts/dev-start-backend.sh"
    echo ""
    echo "2. Test the complete patient flow:"
    echo "   ./scripts/dev-test-patient-flow.sh"
    echo ""
    echo "3. Start frontend applications separately:"
    echo "   cd src/frontend/md-dashboard && npm run dev"
    echo "   cd src/frontend/Phos.PatientPortal && npm start"
    echo ""
    echo "4. Access services:"
    echo "   • Identity API: http://localhost:5501"
    echo "   • Main API: http://localhost:8080"
    echo "   • Redis: localhost:6379"
    echo "   • PostgreSQL: localhost:5432"
    echo ""
}

# Main function
main() {
    print_step "Starting development setup verification..."

    local all_tests_passed=true

    # Run all checks
    if ! check_docker_containers; then
        all_tests_passed=false
    fi

    if ! test_redis; then
        all_tests_passed=false
    fi

    if ! test_postgresql; then
        all_tests_passed=false
    fi

    if ! check_dotnet; then
        all_tests_passed=false
    fi

    if ! check_backend_projects; then
        all_tests_passed=false
    fi

    if ! test_ports; then
        all_tests_passed=false
    fi

    echo ""
    echo "📊 Verification Summary"
    echo "======================"

    if [ "$all_tests_passed" = true ]; then
        print_success "All checks passed! Development environment is ready."
        show_next_steps
    else
        print_error "Some checks failed. Please fix the issues above."
        echo ""
        echo "🔧 Troubleshooting:"
        echo "1. Start Docker Desktop"
        echo "2. Run: docker-compose -f docker-compose.dev.yml up -d"
        echo "3. Install .NET SDK 8.0 if missing"
        echo "4. Check port conflicts"
    fi
}

# Run the main function
main "$@"
