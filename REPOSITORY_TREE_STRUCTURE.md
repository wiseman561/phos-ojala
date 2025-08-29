# Phos Healthcare Platform - Repository Tree Structure

## Full Directory Tree (Depth 4)

```
Phos-healthcare_new/
├── .config/
├── .github/
│   └── workflows/
├── .git/
├── .husky/
├── .nuget/
├── .vscode/
├── charts/
│   ├── ai-engine/
│   ├── api/
│   ├── apigateway/
│   ├── deployment.yaml
│   ├── employer-dashboard/
│   ├── identity/
│   ├── nurse-assistant/
│   ├── patient-app/
│   ├── patient-portal/
│   ├── rn-dashboard/
│   ├── values-prod.yaml
│   ├── values.yaml
│   └── web/
├── cypress/
│   ├── cypress.config.js
│   ├── e2e/
│   ├── package.json
│   └── support/
├── dataprotection-keys/
│   └── key-b1b74c54-2cd2-4493-95ea-d1509bbc0be6.xml
├── db/
│   └── init/
│       └── init-db.sql
├── docs/
├── features/
├── gitops/
│   └── argocd/
├── infra/
│   ├── cloudformation/
│   ├── github-workflows/
│   ├── kubernetes/
│   ├── monitoring/
│   ├── ocelot.json
│   ├── terraform/
│   └── vault/
├── loadtest/
│   ├── docker-compose.override.yml
│   ├── Dockerfile.k6
│   └── script.js
├── monitoring/
│   └── grafana/
├── phos-healthcare-platform/
│   ├── architecture_diagram.md
│   ├── babel.config.js
│   ├── CHANGELOG.md
│   ├── charts/
│   ├── cypress/
│   ├── docs/
│   ├── gitops/
│   ├── infra/
│   ├── integration/
│   ├── loadtest/
│   ├── monitoring/
│   ├── Phos.Api/
│   ├── Phos.Services/
│   ├── phos.web/
│   ├── repo-audit/
│   ├── scripts/
│   ├── src/
│   ├── test-results/
│   ├── tests/
│   ├── tools/
│   ├── vault/
│   └── [various config files]
├── repo-audit/
│   ├── git-dirty.txt
│   └── nuget-outdated.txt
├── scripts/
│   ├── cleanup-and-install.sh
│   ├── cleanup-empty.ts
│   ├── deploy-event-driven-architecture.sh
│   ├── deploy-k8s.sh
│   ├── deploy-local.sh
│   ├── deploy-staging.sh
│   ├── dev-start-backend.sh
│   ├── dev-test-patient-flow.sh
│   ├── dev-verify-setup.sh
│   ├── demo-event-driven-architecture.sh
│   ├── deploy/
│   ├── dev/
│   ├── integration-test.sh
│   ├── move-to-wsl.sh
│   ├── package.json
│   ├── package-lock.json
│   ├── reorganize-frontend-structure.sh
│   ├── run-migrations.sh
│   ├── run-tests.sh
│   ├── test-emergency-alert-system.sh
│   ├── test-end-to-end-flow.sh
│   ├── test-event-driven-architecture.sh
│   ├── test-event-driven-only.sh
│   ├── test-redis-event-bus.py
│   ├── tests/
│   └── tsconfig.json
├── src/
│   ├── __mocks__/
│   ├── __tests__/
│   ├── backend/
│   │   ├── ai-engine/
│   │   ├── AuthControllerManualTest/
│   │   ├── AuthControllerTestRunner/
│   │   ├── AuthControllerTests.Simple/
│   │   ├── Phos.Api/
│   │   ├── Phos.Api.Tests/
│   │   ├── Phos.ApiGateway/
│   │   ├── Phos.AlertsStreamer/
│   │   ├── Phos.Data/
│   │   ├── Phos.DeviceGateway/
│   │   ├── Phos.HealthScore/
│   │   ├── Phos.Identity/
│   │   ├── Phos.OmicsImporter/
│   │   ├── Phos.Services/
│   │   └── Phos.TelemetryProcessor/
│   ├── features/
│   │   └── auth/
│   │       ├── api/
│   │       ├── components/
│   │       ├── contexts/
│   │       ├── hooks/
│   │       └── __tests__/
│   ├── frontend/
│   │   ├── employer-dashboard/
│   │   ├── md-dashboard/
│   │   ├── phos.admin/
│   │   ├── phos.web/
│   │   ├── phos-patient-portal/
│   │   ├── patient-app/
│   │   ├── rn-dashboard/
│   │   └── shared/
│   ├── phos.web/
│   │   ├── App.js
│   │   ├── App.tsx
│   │   ├── AuthContext.js
│   │   ├── package.json
│   │   ├── [various .js and .tsx files]
│   │   └── [other frontend files]
│   ├── scripts/
│   │   ├── move-remaining-tests.ps1
│   │   └── move-tests.ps1
│   ├── shared/
│   │   ├── Phos.Common/
│   │   ├── Phos.Contracts/
│   │   ├── Phos.Data/
│   │   ├── network/
│   │   └── signaling/
│   ├── types/
│   └── utils/
├── test-results/
│   └── jest-junit.xml
├── tests/
│   ├── Phos.HealthScore.Tests/
│   ├── Phos.Tests/
│   ├── Phos.Tests.Integration/
│   ├── Phos.Tests.Unit/
│   └── TestData/
├── tools/
│   ├── install-hooks.ps1
│   ├── install-hooks.sh
│   └── repo-health.ps1
├── vault/
│   ├── ai-engine/
│   ├── api/
│   ├── apigateway/
│   ├── Dockerfile
│   ├── identity/
│   ├── nurse-assistant/
│   ├── policies/
│   ├── README.md
│   ├── role-id
│   ├── scripts/
│   └── templates/
├── .dockerignore
├── .editorconfig
├── .gitignore
├── .gitleaks.toml
├── .npmrc
├── architecture_diagram.md
├── babel.config.cjs
├── build-and-test.sh
├── CHANGELOG.md
├── cleanup-duplicates.ps1
├── cleanup-repository-duplicates.ps1
├── create-env-file.sh
├── Directory.Build.props
├── Directory.Packages.props
├── docker-compose.dev.yml
├── docker-compose.event-driven.yml
├── docker-compose.override.yml
├── docker-compose.override.yml.bak
├── docker-compose.simple.yml
├── docker-compose.test.yml
├── docker-compose.yml
├── docker-smoke-test.sh
├── Dockerfile
├── dotnet-install.sh
├── DOCKER_BUILD_FIXES.md
├── ENVIRONMENT_SETUP.md
├── env.production.template
├── ERROR
├── FRONTEND_REORGANIZATION_SUMMARY.md
├── global.json
├── HIPAA_Infrastructure_Audit_Report.md
├── HIPAA_NETWORK_POLICIES_IMPLEMENTATION.md
├── init-db.dockerfile
├── integration_strategy.md
├── jest.config.js
├── jest.setup.ts
├── JWT_SECRET_MIGRATION_SUMMARY.md
├── ls
├── NuGet.Config
├── Phos.sln
├── omics.dev.yml
├── package.json
├── package-lock.json
├── postgres-migration.bat
├── QUICK_START_GUIDE.md
├── README.md
├── REACT_APPS_CONSOLIDATION_PLAN.md
├── remote
├── REPOSITORY_SCAFFOLDING_FIXES.md
├── setup-wsl-env.sh
├── sync-lockfiles.ps1
├── tatus
├── test-all-builds.ps1
├── test-identity-build.ps1
├── test-build.ps1
├── tsconfig.json
├── validate-build.bat
├── validate-repository-structure.ps1
└── vault-init.sh
```

## Key Observations

### Frontend Structure Issues Identified:
1. **Duplicate Patient Apps**: 
   - `src/phos.web/` (should be moved/consolidated)
   - `src/frontend/patient-app/` (current location)

2. **Inconsistent Naming**:
   - `src/frontend/phos.web/` should be `src/frontend/phos-web/`
   - `src/frontend/Phos.PatientPortal/` should be `src/frontend/phos-patient-portal/`
   - `src/frontend/phos.admin/` should be `src/frontend/phos-admin/`

3. **Misplaced Frontend Code**:
   - `src/features/auth/` (appears to be frontend-related, should be in `src/frontend/shared/auth/`)

### Backend Structure:
- Well-organized under `src/backend/`
- Multiple API services properly structured
- Test projects properly organized

### Scripts and Tools:
- Comprehensive set of development and deployment scripts
- Obsolete migration scripts identified for removal

## Recommendations

1. **Execute Frontend Reorganization**: Run `scripts/reorganize-frontend-structure.sh`
2. **Remove Obsolete Scripts**: Delete `src/scripts/move-remaining-tests.ps1` and `src/scripts/move-tests.ps1`
3. **Consolidate Duplicates**: Merge `src/phos.web/` with `src/frontend/patient-app/`
4. **Update References**: Ensure all configuration files reference the new structure

This tree structure confirms the need for the frontend reorganization that was planned in the previous steps. 
