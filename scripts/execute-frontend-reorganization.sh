#!/bin/bash
# Execute Frontend Reorganization Script
# This script performs all frontend reorganization tasks

set -e

echo "===== EXECUTING FRONTEND REORGANIZATION ====="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Step 1: Remove obsolete migration scripts
echo "Step 1: Removing obsolete migration scripts..."
if [ -f "src/scripts/move-remaining-tests.ps1" ]; then
    rm src/scripts/move-remaining-tests.ps1
    print_success "Removed src/scripts/move-remaining-tests.ps1"
else
    print_warning "src/scripts/move-remaining-tests.ps1 not found"
fi

if [ -f "src/scripts/move-tests.ps1" ]; then
    rm src/scripts/move-tests.ps1
    print_success "Removed src/scripts/move-tests.ps1"
else
    print_warning "src/scripts/move-tests.ps1 not found"
fi

# Step 2: Rename directories for consistency
echo ""
echo "Step 2: Renaming directories for consistency..."

# Rename phos.web to phos-web
if [ -d "src/frontend/phos.web" ]; then
    mv src/frontend/phos.web src/frontend/phos-web
    print_success "Renamed src/frontend/phos.web to src/frontend/phos-web"
else
    print_warning "src/frontend/phos.web not found"
fi

# Rename Phos.PatientPortal to phos-patient-portal
if [ -d "src/frontend/Phos.PatientPortal" ]; then
    mv src/frontend/Phos.PatientPortal src/frontend/phos-patient-portal
    print_success "Renamed src/frontend/Phos.PatientPortal to src/frontend/phos-patient-portal"
else
    print_warning "src/frontend/Phos.PatientPortal not found"
fi

# Rename phos.admin to phos-admin
if [ -d "src/frontend/phos.admin" ]; then
    mv src/frontend/phos.admin src/frontend/phos-admin
    print_success "Renamed src/frontend/phos.admin to src/frontend/phos-admin"
else
    print_warning "src/frontend/phos.admin not found"
fi

# Step 3: Handle duplicate patient app
echo ""
echo "Step 3: Handling duplicate patient app..."
if [ -d "src/phos.web" ] && [ -d "src/frontend/patient-app" ]; then
    echo "Found both src/phos.web and src/frontend/patient-app"

    # Compare package.json files
    if cmp -s src/phos.web/package.json src/frontend/patient-app/package.json; then
        print_warning "Package.json files are identical - src/phos.web is redundant"
        print_status "Removing redundant src/phos.web directory..."
        rm -rf src/phos.web
        print_success "Removed src/phos.web"
    else
        print_warning "Package.json files differ - manual review needed"
        print_status "Moving src/phos.web to src/frontend/legacy-patient-app..."
        mv src/phos.web src/frontend/legacy-patient-app
        print_success "Moved src/phos.web to src/frontend/legacy-patient-app"
    fi
elif [ -d "src/phos.web" ]; then
    print_status "Found only src/phos.web - moving to frontend structure..."
    mv src/phos.web src/frontend/patient-app
    print_success "Moved src/phos.web to src/frontend/patient-app"
elif [ -d "src/frontend/patient-app" ]; then
    print_success "src/frontend/patient-app already exists"
else
    print_warning "No patient-app found"
fi

# Step 4: Move frontend features
echo ""
echo "Step 4: Moving frontend features..."
if [ -d "src/features/auth" ]; then
    print_status "Found src/features/auth - checking if it's frontend-related..."

    if [ -f "src/features/auth/package.json" ] || [ -d "src/features/auth/components" ]; then
        print_status "Moving src/features/auth to src/frontend/shared/auth..."
        mkdir -p src/frontend/shared
        mv src/features/auth src/frontend/shared/
        print_success "Moved auth features to frontend shared"
    else
        print_warning "src/features/auth appears to be backend-related - keeping in place"
    fi
else
    print_warning "src/features/auth not found"
fi

# Step 5: Make build script executable
echo ""
echo "Step 5: Making build script executable..."
if [ -f "scripts/build-all-frontends.sh" ]; then
    chmod +x scripts/build-all-frontends.sh
    print_success "Made scripts/build-all-frontends.sh executable"
else
    print_error "scripts/build-all-frontends.sh not found"
fi

# Step 6: Display final structure
echo ""
echo "Step 6: Final frontend structure:"
if [ -d "src/frontend" ]; then
    echo "Frontend applications:"
    for app in src/frontend/*/; do
        if [ -d "$app" ]; then
            app_name=$(basename "$app")
            if [ -f "$app/package.json" ]; then
                name=$(grep '"name"' "$app/package.json" | head -1 | sed 's/.*"name": *"\([^"]*\)".*/\1/')
                echo "  - $app_name (package: $name)"
            else
                echo "  - $app_name (no package.json)"
            fi
        fi
    done
else
    print_error "src/frontend directory not found"
fi

echo ""
echo "===== FRONTEND REORGANIZATION COMPLETED ====="
print_success "All reorganization tasks completed successfully!"
echo ""
echo "Next steps:"
echo "1. Test that all applications build: ./scripts/build-all-frontends.sh"
echo "2. Test backend build: dotnet restore Phos.sln && dotnet build Phos.sln"
echo "3. Run tests: dotnet test Phos.sln"
echo "4. Verify Docker builds: docker-compose build"
