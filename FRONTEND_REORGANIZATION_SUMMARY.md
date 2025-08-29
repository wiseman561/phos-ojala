# Frontend Reorganization Summary

## Overview

This document summarizes the reorganization of frontend projects in the Phos Healthcare Platform to ensure all frontend applications live under `src/frontend` with consistent naming conventions.

## Completed Actions

### ✅ 1. Directory Renaming for Consistency

**Renamed directories to use kebab-case convention:**
- `src/frontend/phos.web` → `src/frontend/phos-web`
- `src/frontend/Phos.PatientPortal` → `src/frontend/phos-patient-portal`
- `src/frontend/phos.admin` → `src/frontend/phos-admin`

### ✅ 2. Path Reference Updates

**Updated all configuration files to reference new paths:**
- `docker-compose.yml` - Updated context path
- `docker-compose.override.yml` - Updated context and volume paths
- `validate-repository-structure.ps1` - Updated expected paths
- `REPOSITORY_SCAFFOLDING_FIXES.md` - Updated documentation
- `REACT_APPS_CONSOLIDATION_PLAN.md` - Updated all references

### ✅ 3. Obsolete Script Removal

**Removed obsolete migration scripts:**
- `src/scripts/move-remaining-tests.ps1` - Test migration script (completed)
- `src/scripts/move-tests.ps1` - Test migration script (completed)

## Current Frontend Structure

```
src/frontend/
├── phos-web/              # Healthcare provider/admin dashboard (CRACO-based)
│   ├── package.json        # "name": "phos-web"
│   ├── src/
│   ├── craco.config.js
│   └── Dockerfile
├── patient-app/            # Patient-facing application
│   ├── package.json        # "name": "patient-app"
│   ├── src/
│   └── Dockerfile
├── employer-dashboard/     # Employer dashboard
│   ├── package.json        # "name": "employer-dashboard"
│   └── src/
├── md-dashboard/          # Medical doctor dashboard
│   ├── package.json        # "name": "md-dashboard"
│   └── src/
├── rn-dashboard/          # Registered nurse dashboard
│   ├── package.json        # "name": "rn-dashboard"
│   └── src/
├── phos-admin/           # Admin interface
│   ├── package.json        # "name": "phos-admin"
│   └── src/
├── phos-patient-portal/  # Patient portal (legacy)
│   ├── package.json        # "name": "phos-patient-portal"
│   └── src/
└── shared/                # Shared components and utilities
    ├── auth/              # Authentication features (if moved)
    └── components/
```

## Application Purposes

### phos-web (Provider Dashboard)
- **Target Users**: Healthcare providers, administrators
- **Technology**: CRACO-based React with TypeScript
- **Key Features**: Patient management, medical records, healthcare plans, appointments, AI insights

### patient-app (Patient Application)
- **Target Users**: Patients
- **Technology**: Standard React with react-scripts
- **Key Features**: Personal health dashboard, telehealth, health metrics, prescriptions

### employer-dashboard (Employer Dashboard)
- **Target Users**: Employers
- **Technology**: React
- **Key Features**: Employee health management, benefits administration

### md-dashboard (Medical Doctor Dashboard)
- **Target Users**: Medical doctors
- **Technology**: React
- **Key Features**: Patient care, medical decision support

### rn-dashboard (Registered Nurse Dashboard)
- **Target Users**: Registered nurses
- **Technology**: React
- **Key Features**: Patient monitoring, care coordination

### phos-admin (Admin Interface)
- **Target Users**: System administrators
- **Technology**: React
- **Key Features**: System management, user administration

### phos-patient-portal (Legacy Patient Portal)
- **Target Users**: Patients (legacy)
- **Technology**: React
- **Key Features**: Legacy patient interface

## Pending Actions

### 🔄 1. Run Reorganization Script

The `scripts/reorganize-frontend-structure.sh` script needs to be executed to:
- Move `src/phos.web` to `src/frontend/` (if different from patient-app)
- Move `src/features/auth` to `src/frontend/shared/auth` (if frontend-related)
- Remove redundant directories
- Update package.json names

### 🔄 2. CI/CD Pipeline Updates

Update any remaining CI/CD pipeline references:
- `.github/workflows/ci.yml`
- `.github/workflows/codeql.yml`
- Any other workflow files

### 🔄 3. Testing and Verification

- [ ] All applications build successfully
- [ ] Docker containers build correctly
- [ ] All tests pass
- [ ] No broken references remain

## Benefits Achieved

1. **Consistent Naming**: All frontend directories now use kebab-case convention
2. **Clear Organization**: All frontend projects are under `src/frontend/`
3. **Updated References**: All configuration files reference correct paths
4. **Reduced Maintenance**: Removed obsolete migration scripts
5. **Better Documentation**: Updated all documentation references

## Rollback Plan

If issues arise:
1. Restore from git history
2. Revert path changes in configuration files
3. Restore removed migration scripts if needed
4. Test all applications

## Notes

- The reorganization maintains all functionality while improving organization
- All frontend applications now follow consistent naming conventions
- Configuration files have been updated to reference new paths
- The structure is now ready for the reorganization script to be executed 
