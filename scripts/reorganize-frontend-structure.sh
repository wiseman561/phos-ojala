#!/usr/bin/env bash
# Reorganize Frontend Structure Script
# This script consolidates and reorganizes all frontend projects under src/frontend

set -e

echo "===== REORGANIZING FRONTEND STRUCTURE ====="

# Step 1: Move src/phos.web to src/frontend/ if it exists and is different from patient-app
echo "Step 1: Handling src/phos.web..."
if [ -d "src/phos.web" ]; then
    if [ -d "src/frontend/patient-app" ]; then
        echo "Comparing src/phos.web with src/frontend/patient-app..."
        if cmp -s src/phos.web/package.json src/frontend/patient-app/package.json; then
            echo "✅ src/phos.web is identical to src/frontend/patient-app - removing redundant directory"
            rm -rf src/phos.web
        else
            echo "⚠️  src/phos.web differs from src/frontend/patient-app - moving to frontend as legacy-patient-app"
            mv src/phos.web src/frontend/legacy-patient-app
        fi
    else
        echo "Moving src/phos.web to src/frontend/patient-app"
        mv src/phos.web src/frontend/patient-app
    fi
else
    echo "✅ src/phos.web not found"
fi

# Step 2: Move src/features/auth to src/frontend/shared/auth if it's frontend-related
echo "Step 2: Checking src/features/auth..."
if [ -d "src/features/auth" ]; then
    echo "Found src/features/auth - checking if it's frontend-related..."
    if [ -f "src/features/auth/package.json" ] || [ -d "src/features/auth/components" ]; then
        echo "Moving src/features/auth to src/frontend/shared/auth"
        mkdir -p src/frontend/shared
        mv src/features/auth src/frontend/shared/
        echo "✅ Moved auth features to frontend shared"
    else
        echo "src/features/auth appears to be backend-related - keeping in place"
    fi
else
    echo "✅ src/features/auth not found"
fi

# Step 3: Rename directories for consistency (kebab-case)
echo "Step 3: Renaming directories for consistency..."

# Rename phos.web to phos-web
if [ -d "src/frontend/phos.web" ]; then
    echo "Renaming src/frontend/phos.web to src/frontend/phos-web"
    mv src/frontend/phos.web src/frontend/phos-web
    echo "✅ Renamed phos.web to phos-web"
fi

# Rename Phos.PatientPortal to phos-patient-portal
if [ -d "src/frontend/Phos.PatientPortal" ]; then
    echo "Renaming src/frontend/Phos.PatientPortal to src/frontend/phos-patient-portal"
    mv src/frontend/Phos.PatientPortal src/frontend/phos-patient-portal
    echo "✅ Renamed Phos.PatientPortal to phos-patient-portal"
fi

# Rename phos.admin to phos-admin
if [ -d "src/frontend/phos.admin" ]; then
    echo "Renaming src/frontend/phos.admin to src/frontend/phos-admin"
    mv src/frontend/phos.admin src/frontend/phos-admin
    echo "✅ Renamed phos.admin to phos-admin"
fi

# Step 4: Remove obsolete migration scripts
echo "Step 4: Removing obsolete migration scripts..."
if [ -f "src/scripts/move-remaining-tests.ps1" ]; then
    echo "Removing obsolete move-remaining-tests.ps1"
    rm src/scripts/move-remaining-tests.ps1
    echo "✅ Removed move-remaining-tests.ps1"
fi

if [ -f "src/scripts/move-tests.ps1" ]; then
    echo "Removing obsolete move-tests.ps1"
    rm src/scripts/move-tests.ps1
    echo "✅ Removed move-tests.ps1"
fi

# Step 5: Update package.json names for consistency
echo "Step 5: Updating package.json names for consistency..."

# Update phos-web package.json
if [ -f "src/frontend/phos-web/package.json" ]; then
    echo "Updating phos-web package.json name..."
    sed -i 's/"name": "phos-web"/"name": "phos-web"/' src/frontend/phos-web/package.json
    echo "✅ Updated phos-web package.json"
fi

# Update phos-admin package.json
if [ -f "src/frontend/phos-admin/package.json" ]; then
    echo "Updating phos-admin package.json name..."
    sed -i 's/"name": "phos-admin"/"name": "phos-admin"/' src/frontend/phos-admin/package.json
    echo "✅ Updated phos-admin package.json"
fi

# Update phos-patient-portal package.json
if [ -f "src/frontend/phos-patient-portal/package.json" ]; then
    echo "Updating phos-patient-portal package.json name..."
    sed -i 's/"name": "phos-patient-portal"/"name": "phos-patient-portal"/' src/frontend/phos-patient-portal/package.json
    echo "✅ Updated phos-patient-portal package.json"
fi

# Step 6: Display final structure
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
    echo "⚠️  src/frontend directory not found"
fi

# Step 7: Create a summary of changes needed
echo "Step 7: Files that need path updates:"
echo "The following files reference old paths and need updates:"
echo "  - docker-compose.yml (line 129: src/frontend/phos.web → src/frontend/phos-web)"
echo "  - docker-compose.override.yml (lines 169, 175, 190: src/frontend/phos.web → src/frontend/phos-web)"
echo "  - validate-repository-structure.ps1 (line 23: src/frontend/phos.web → src/frontend/phos-web)"
echo "  - REACT_APPS_CONSOLIDATION_PLAN.md (update all references)"
echo "  - REPOSITORY_SCAFFOLDING_FIXES.md (line 199: src/frontend/phos.web → src/frontend/phos-web)"

echo "===== REORGANIZATION COMPLETED ====="
echo "Next steps:"
echo "1. Update the files listed above with new paths"
echo "2. Test that all applications build and run correctly"
echo "3. Update CI/CD pipelines if needed"
echo "4. Update documentation references"
