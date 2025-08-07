#!/bin/bash
# Build All Frontend Applications Script
# This script builds all frontend applications in the Phos Healthcare Platform

set -e

echo "===== BUILDING ALL FRONTEND APPLICATIONS ====="

# Define all frontend applications
APPS=(
    "phos-web"
    "patient-app"
    "employer-dashboard"
    "md-dashboard"
    "rn-dashboard"
    "phos-admin"
    "phos-patient-portal"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Track build results
BUILD_RESULTS=()
FAILED_BUILDS=()

# Build each application
for app in "${APPS[@]}"; do
    app_dir="src/frontend/$app"

    if [ ! -d "$app_dir" ]; then
        print_warning "Directory $app_dir not found, skipping..."
        FAILED_BUILDS+=("$app (directory not found)")
        continue
    fi

    if [ ! -f "$app_dir/package.json" ]; then
        print_warning "No package.json found in $app_dir, skipping..."
        FAILED_BUILDS+=("$app (no package.json)")
        continue
    fi

    print_status "Building $app..."

    # Store current directory
    CURRENT_DIR=$(pwd)

    # Change to app directory
    cd "$app_dir"

    # Check if node_modules exists, if not install dependencies
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies for $app..."
        if npm install; then
            print_success "Dependencies installed for $app"
        else
            print_error "Failed to install dependencies for $app"
            FAILED_BUILDS+=("$app (dependency install failed)")
            cd "$CURRENT_DIR"
            continue
        fi
    fi

    # Build the application
    print_status "Building $app..."
    if npm run build; then
        print_success "Successfully built $app"
        BUILD_RESULTS+=("$app")
    else
        print_error "Failed to build $app"
        FAILED_BUILDS+=("$app (build failed)")
    fi

    # Return to original directory
    cd "$CURRENT_DIR"

    echo ""
done

# Summary
echo "===== BUILD SUMMARY ====="
echo ""

if [ ${#BUILD_RESULTS[@]} -gt 0 ]; then
    print_success "Successfully built ${#BUILD_RESULTS[@]} applications:"
    for app in "${BUILD_RESULTS[@]}"; do
        echo "  ✅ $app"
    done
    echo ""
fi

if [ ${#FAILED_BUILDS[@]} -gt 0 ]; then
    print_error "Failed to build ${#FAILED_BUILDS[@]} applications:"
    for app in "${FAILED_BUILDS[@]}"; do
        echo "  ❌ $app"
    done
    echo ""
fi

# Exit with error if any builds failed
if [ ${#FAILED_BUILDS[@]} -gt 0 ]; then
    print_error "Some builds failed. Please check the errors above."
    exit 1
else
    print_success "All frontend applications built successfully!"
    exit 0
fi
