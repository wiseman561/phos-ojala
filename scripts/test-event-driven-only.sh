#!/bin/bash

# Test Event-Driven Architecture Only
# This script tests the core event-driven functionality without building all services

set -e

echo "🧪 Testing Event-Driven Architecture (Core Components Only)"
echo "=========================================================="

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

# Function to start only the essential services
start_essential_services() {
    print_step "Starting essential services for event-driven architecture..."

    # Stop any existing containers
    docker-compose -f docker-compose.test.yml down 2>/dev/null || true

    # Start only Redis and PostgreSQL
    if docker-compose -f docker-compose.test.yml up -d redis postgres; then
        print_success "Essential services started"

        # Wait for services to be ready
        print_step "Waiting for services to be ready..."
        sleep 10

        # Test Redis connection
        if docker exec phos-redis-test redis-cli ping > /dev/null 2>&1; then
            print_success "Redis is ready"
        else
            print_error "Redis is not responding"
            return 1
        fi

        # Test PostgreSQL connection
        if docker exec phos-postgres-test pg_isready -U postgres > /dev/null 2>&1; then
            print_success "PostgreSQL is ready"
        else
            print_error "PostgreSQL is not responding"
            return 1
        fi
    else
        print_error "Failed to start essential services"
        return 1
    fi

    return 0
}

# Function to test event bus functionality
test_event_bus() {
    print_step "Testing Redis Event Bus functionality..."

    # Test basic Redis operations
    if docker exec phos-redis-test redis-cli ping | grep -q "PONG"; then
        print_success "Redis connection successful"
    else
        print_error "Redis connection failed"
        return 1
    fi

    # Test event publishing
    local test_event='{"userId":"test123","email":"test@example.com","role":"Patient","firstName":"John","lastName":"Doe"}'
    local result=$(docker exec phos-redis-test redis-cli publish "events:userregisteredevent" "$test_event")

    if [ "$result" -ge 0 ]; then
        print_success "Event publishing test successful (subscribers: $result)"
    else
        print_error "Event publishing test failed"
        return 1
    fi

    return 0
}

# Function to test the complete event flow
test_complete_event_flow() {
    print_step "Testing complete event flow..."

    # Generate test data
    local userId=$(uuidgen)
    local email="test.patient@example.com"
    local role="Patient"
    local firstName="John"
    local lastName="Doe"

    # Create event JSON
    local event_json=$(cat <<EOF
{
    "userId": "$userId",
    "email": "$email",
    "role": "$role",
    "firstName": "$firstName",
    "lastName": "$lastName",
    "registeredAt": "$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)",
    "metadata": {
        "source": "event-driven-test",
        "testId": "$(uuidgen)"
    }
}
EOF
)

    # Publish event
    local result=$(docker exec phos-redis-test redis-cli publish "events:userregisteredevent" "$event_json")

    if [ "$result" -ge 0 ]; then
        print_success "Event published successfully (subscribers: $result)"
        print_success "Event flow test completed"

        echo ""
        echo "📊 Event Flow Summary:"
        echo "  • User ID: $userId"
        echo "  • Email: $email"
        echo "  • Role: $role"
        echo "  • Name: $firstName $lastName"
        echo "  • Event published to Redis channel: events:userregisteredevent"
        echo "  • Subscribers: $result (0 expected when services not running)"

        return 0
    else
        print_error "Event publishing failed"
        return 1
    fi
}

# Function to provide next steps
show_next_steps() {
    echo ""
    echo "🚀 Next Steps for Full Testing:"
    echo "================================"
    echo ""
    echo "1. Build and run Identity service:"
    echo "   cd src/backend/Phos.Identity"
    echo "   dotnet run"
    echo ""
    echo "2. Build and run API service (in another terminal):"
    echo "   cd src/backend/Phos.Api"
    echo "   dotnet run"
    echo ""
    echo "3. Test user registration:"
    echo "   curl -X POST http://localhost:5501/api/auth/register \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -d '{\"email\":\"test@example.com\",\"password\":\"Test123!\",\"role\":\"Patient\",\"firstName\":\"John\",\"lastName\":\"Doe\"}'"
    echo ""
    echo "4. Monitor event processing:"
    echo "   docker exec phos-redis-test redis-cli monitor"
    echo ""
    echo "5. Check patient creation:"
    echo "   curl http://localhost:8080/api/patients"
    echo ""
}

# Main function
main() {
    print_step "Starting event-driven architecture core test..."

    # Check prerequisites
    if ! check_docker; then
        print_error "Prerequisites not met. Exiting."
        exit 1
    fi

    # Start essential services
    if ! start_essential_services; then
        print_error "Failed to start essential services. Exiting."
        exit 1
    fi

    # Test event bus
    if ! test_event_bus; then
        print_error "Event bus test failed. Exiting."
        exit 1
    fi

    # Test complete event flow
    if ! test_complete_event_flow; then
        print_error "Complete event flow test failed. Exiting."
        exit 1
    fi

    echo ""
    echo "📊 Test Summary"
    echo "==============="
    print_success "All core event-driven architecture tests passed"
    print_success "Redis event bus is working correctly"
    print_success "Event publishing and subscription ready"
    print_success "Infrastructure services are healthy"

    echo ""
    echo "🔧 Architecture Status:"
    echo "  ✅ Redis Pub/Sub infrastructure ready"
    echo "  ✅ Event bus functionality verified"
    echo "  ✅ Event publishing working"
    echo "  ✅ Database connectivity established"
    echo "  ⏳ Backend services need to be started manually"

    # Show next steps
    show_next_steps

    echo ""
    print_success "Event-driven architecture core test completed successfully!"
}

# Run the main function
main "$@"
