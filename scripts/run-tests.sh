#!/bin/bash

# Phos Healthcare Platform Test Runner
# This script handles repository migration, Docker setup, and test execution

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_NAME="Phos-healthcare_new"
WSL_PROJECTS_DIR="$HOME/projects"
WSL_REPO_PATH="$WSL_PROJECTS_DIR/$REPO_NAME"
WINDOWS_REPO_PATH="/mnt/c/Users/15612/Desktop/Repositories/$REPO_NAME"

echo -e "${BLUE}🚀 Phos Healthcare Platform Test Runner${NC}"
echo "=========================================="

# Function to check if we're in WSL
check_wsl() {
    if [[ ! -f /proc/version ]] || ! grep -q Microsoft /proc/version; then
        echo -e "${YELLOW}⚠️  This script is designed for WSL environments${NC}"
        echo "If you're running this elsewhere, ensure Docker is available."
    fi
}

# Function to check if repo is in WSL-native storage
check_repo_location() {
    if [[ "$PWD" == /mnt/c/* ]]; then
        echo -e "${YELLOW}⚠️  Repository is in Windows-mounted path${NC}"
        echo "This may cause I/O errors. Moving to WSL-native storage..."

        if [ ! -d "$WSL_REPO_PATH" ]; then
            echo -e "${BLUE}📦 Moving repository to WSL-native storage...${NC}"
            bash "$(dirname "$0")/move-to-wsl.sh"
        else
            echo -e "${GREEN}✅ Repository already exists in WSL-native storage${NC}"
        fi

        echo -e "${BLUE}🔄 Switching to WSL-native repository...${NC}"
        cd "$WSL_REPO_PATH"
    else
        echo -e "${GREEN}✅ Repository is in WSL-native storage${NC}"
    fi
}

# Function to check Docker availability
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker is not installed or not available${NC}"
        echo "Please install Docker and ensure it's running."
        exit 1
    fi

    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker daemon is not running${NC}"
        echo "Please start Docker Desktop or the Docker daemon."
        exit 1
    fi

    echo -e "${GREEN}✅ Docker is available${NC}"
}

# Function to check .NET SDK
check_dotnet() {
    if ! command -v dotnet &> /dev/null; then
        echo -e "${YELLOW}⚠️  .NET SDK not found locally${NC}"
        echo "Will use Docker container with .NET 9.0.203 SDK"
    else
        echo -e "${GREEN}✅ .NET SDK found locally${NC}"
        dotnet --version
    fi
}

# Function to run tests locally (if .NET SDK is available)
run_tests_local() {
    if command -v dotnet &> /dev/null; then
        echo -e "${BLUE}🧪 Running tests locally...${NC}"
        echo "📦 Restoring packages..."
        dotnet restore --verbosity normal

        echo "🔨 Building solution..."
        dotnet build --no-restore --verbosity normal

        echo "🧪 Running tests..."
        dotnet test --no-build --verbosity normal --logger 'console;verbosity=normal'

        echo -e "${GREEN}✅ Local tests completed!${NC}"
        return 0
    else
        return 1
    fi
}

# Function to run tests in Docker
run_tests_docker() {
    echo -e "${BLUE}🐳 Running tests in Docker container...${NC}"

    # Stop any existing containers
    docker-compose -f docker-compose.test.yml down 2>/dev/null || true

    # Run tests
    docker-compose -f docker-compose.test.yml up --build --abort-on-container-exit

    # Get exit code
    EXIT_CODE=$(docker-compose -f docker-compose.test.yml ps -q tests | xargs docker inspect -f '{{.State.ExitCode}}')

    # Clean up
    docker-compose -f docker-compose.test.yml down

    if [ "$EXIT_CODE" = "0" ]; then
        echo -e "${GREEN}✅ Docker tests completed successfully!${NC}"
        return 0
    else
        echo -e "${RED}❌ Docker tests failed with exit code: $EXIT_CODE${NC}"
        return 1
    fi
}

# Main execution
main() {
    check_wsl
    check_repo_location
    check_docker
    check_dotnet

    echo ""
    echo -e "${BLUE}🎯 Starting test execution...${NC}"

    # Try local execution first, fall back to Docker
    if ! run_tests_local; then
        echo -e "${YELLOW}⚠️  Local execution failed, using Docker...${NC}"
        run_tests_docker
    fi

    echo ""
    echo -e "${GREEN}🎉 Test execution completed!${NC}"
}

# Run main function
main "$@"
