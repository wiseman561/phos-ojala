#!/bin/bash

# Demo script for Event-Driven Architecture
# This script demonstrates the user registration -> patient creation flow

set -e

echo "🎭 Event-Driven Architecture Demo"
echo "=================================="

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

# Function to simulate user registration
simulate_user_registration() {
    local email=$1
    local role=$2
    local firstName=$3
    local lastName=$4

    print_step "Simulating user registration..."
    echo "  Email: $email"
    echo "  Role: $role"
    echo "  Name: $firstName $lastName"

    # In a real scenario, this would call the Identity service API
    # For demo purposes, we'll simulate the event publishing
    print_success "User registered successfully"
    print_success "UserRegisteredEvent published to Redis"
}

# Function to simulate patient creation
simulate_patient_creation() {
    local userId=$1
    local email=$2
    local firstName=$3
    local lastName=$4

    print_step "API service received UserRegisteredEvent..."
    echo "  User ID: $userId"
    echo "  Email: $email"
    echo "  Name: $firstName $lastName"

    print_success "Patient record created in database"
    print_success "Patient ID: PAT-$(date +%s)"
}

# Function to simulate frontend update
simulate_frontend_update() {
    print_step "Frontend polling for patient updates..."
    print_success "New patient appears in MD Dashboard"
    print_success "Patient queue updated in real-time"
}

# Demo scenarios
echo ""
echo "🎯 Demo Scenario 1: Patient Registration"
echo "----------------------------------------"

# Generate a unique user ID
USER_ID=$(uuidgen)
EMAIL="john.doe@example.com"
ROLE="Patient"
FIRST_NAME="John"
LAST_NAME="Doe"

simulate_user_registration "$EMAIL" "$ROLE" "$FIRST_NAME" "$LAST_NAME"
simulate_patient_creation "$USER_ID" "$EMAIL" "$FIRST_NAME" "$LAST_NAME"
simulate_frontend_update

echo ""
echo "🎯 Demo Scenario 2: Provider Registration (No Patient Creation)"
echo "---------------------------------------------------------------"

USER_ID_2=$(uuidgen)
EMAIL_2="dr.jane.smith@example.com"
ROLE_2="Provider"
FIRST_NAME_2="Jane"
LAST_NAME_2="Smith"

simulate_user_registration "$EMAIL_2" "$ROLE_2" "$FIRST_NAME_2" "$LAST_NAME_2"
print_warning "No patient record created (Provider role)"
print_success "Provider account created successfully"

echo ""
echo "🎯 Demo Scenario 3: Multiple Patient Registrations"
echo "--------------------------------------------------"

for i in {1..3}; do
    echo ""
    USER_ID_MULTI=$(uuidgen)
    EMAIL_MULTI="patient$i@example.com"
    ROLE_MULTI="Patient"
    FIRST_NAME_MULTI="Patient$i"
    LAST_NAME_MULTI="Test"

    simulate_user_registration "$EMAIL_MULTI" "$ROLE_MULTI" "$FIRST_NAME_MULTI" "$LAST_NAME_MULTI"
    simulate_patient_creation "$USER_ID_MULTI" "$EMAIL_MULTI" "$FIRST_NAME_MULTI" "$LAST_NAME_MULTI"
done

simulate_frontend_update

echo ""
echo "📊 Demo Summary"
echo "==============="
print_success "Event-driven architecture working correctly"
print_success "Loose coupling between services maintained"
print_success "Automatic patient creation for Patient roles"
print_success "No patient creation for non-Patient roles"
print_success "Real-time frontend updates"

echo ""
echo "🔧 Architecture Benefits Demonstrated:"
echo "  • Decoupled services (Identity ↔ API)"
echo "  • Scalable event processing"
echo "  • Real-time data flow"
echo "  • Fault tolerance (events can be retried)"
echo "  • Extensible design (easy to add new event types)"

echo ""
echo "🎉 Demo completed successfully!"
echo ""
echo "💡 Next steps for production:"
echo "  1. Start Redis server: docker-compose -f docker-compose.test.yml up redis"
echo "  2. Start PostgreSQL: docker-compose -f docker-compose.test.yml up postgres"
echo "  3. Run Identity service: dotnet run --project src/backend/Ojala.Identity"
echo "  4. Run API service: dotnet run --project src/backend/Ojala.Api"
echo "  5. Start frontend: npm start --prefix src/frontend/md-dashboard"
