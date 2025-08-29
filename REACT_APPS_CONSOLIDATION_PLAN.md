# React Applications Consolidation Plan

## Overview

This document outlines the consolidation of React applications in the Phos Healthcare Platform to eliminate redundancy and establish consistent naming conventions.

## Current State Analysis

### Identified React Applications

1. **src/phos.web** (Patient App)
   - **Name**: "patient-app"
   - **Purpose**: Patient-facing application
   - **Technology**: Standard React with react-scripts
   - **Features**: Patient dashboard, telehealth, health metrics, prescriptions
   - **Status**: Redundant with src/frontend/patient-app

2. **src/frontend/phos-web** (CRACO-based Web App)
   - **Name**: "phos-web"
   - **Purpose**: Healthcare provider/admin dashboard
   - **Technology**: CRACO-based React with TypeScript support
   - **Features**: Provider dashboard, patient management, medical records
   - **Status**: Current and properly structured

3. **src/frontend/patient-app** (Existing Patient App)
   - **Name**: "patient-app"
   - **Purpose**: Patient-facing application
   - **Technology**: Standard React with react-scripts
   - **Status**: Identical to src/phos.web

## Consolidation Plan

### Step 1: Directory Renaming for Consistency

**Action**: Rename `src/frontend/phos.web` to `src/frontend/phos-web` ✅ **COMPLETED**
- **Rationale**: Consistent kebab-case naming convention
- **Impact**: Updates references in CI/CD, Docker, and documentation

### Step 2: Remove Redundant Patient App

**Action**: Remove `src/phos.web` directory
- **Rationale**: Identical to `src/frontend/patient-app` (same package.json)
- **Impact**: Eliminates confusion and maintenance overhead

### Step 3: Final Directory Structure

```
src/frontend/
├── phos-web/          # Healthcare provider/admin dashboard (CRACO-based)
├── patient-app/        # Patient-facing application
├── employer-dashboard/ # Employer dashboard
├── md-dashboard/       # Medical doctor dashboard
├── rn-dashboard/       # Registered nurse dashboard
├── phos.admin/        # Admin interface
├── Phos.PatientPortal/# Patient portal (legacy)
└── shared/            # Shared components and utilities
```

## Implementation Steps

### 1. Run Consolidation Script

```bash
# Make script executable
chmod +x scripts/consolidate-react-apps.sh

# Run consolidation
./scripts/consolidate-react-apps.sh
```

### 2. Update References

The following files need path updates:

#### CI/CD Pipelines
- `.github/workflows/ci.yml`
- `.github/workflows/codeql.yml`
- Update `src/frontend/phos.web` → `src/frontend/phos-web` ✅ **COMPLETED**

#### Docker Configuration
- `docker-compose.yml`
- Update context paths

#### Documentation
- Update any hardcoded references in documentation
- Update README files

### 3. Update Scripts

#### cleanup-and-install.sh
The script already uses automatic detection, so no changes needed.

#### Other Build Scripts
- Verify all build scripts work with new paths
- Update any hardcoded references

## Application Purposes

### phos-web (Provider Dashboard)
- **Target Users**: Healthcare providers, administrators
- **Key Features**:
  - Patient management
  - Medical records
  - Healthcare plans
  - Appointments
  - AI insights
  - Analytics dashboard

### patient-app (Patient Application)
- **Target Users**: Patients
- **Key Features**:
  - Personal health dashboard
  - Telehealth integration
  - Health metrics tracking
  - Prescription management
  - Appointment scheduling
  - Secure messaging

## Benefits of Consolidation

1. **Eliminates Redundancy**: Removes duplicate patient-app code
2. **Consistent Naming**: Establishes kebab-case convention
3. **Clear Organization**: All frontend apps in `src/frontend/`
4. **Reduced Maintenance**: Single source of truth for each app type
5. **Better CI/CD**: Cleaner pipeline configuration

## Verification Checklist

- [ ] Consolidation script runs successfully
- [ ] All applications build without errors
- [ ] CI/CD pipelines updated and working
- [ ] Docker containers build correctly
- [ ] Documentation updated
- [ ] No broken references remain
- [ ] All tests pass

## Rollback Plan

If issues arise:
1. Restore from git history
2. Revert any path changes in CI/CD
3. Update Docker configurations back
4. Test all applications

## Notes

- The `src/frontend/phos-web` (CRACO-based) is the more current and properly structured application
- The `src/phos.web` and `src/frontend/patient-app` are identical
- The consolidation maintains all functionality while improving organization 
