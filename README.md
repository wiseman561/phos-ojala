## Quick Start (PHOS)
1. Devcontainer: open in GitHub Codespaces or VS Code Dev Containers.
2. Copy envs:
   ```bash
   cp .env.example .env
   # Frontend apps
   cp src/frontend/phos-web/.env.example src/frontend/phos-web/.env
   cp src/frontend/employer-dashboard/.env.example src/frontend/employer-dashboard/.env
   cp src/frontend/patient-app/.env.example src/frontend/patient-app/.env
   cp src/frontend/rn-dashboard/.env.example src/frontend/rn-dashboard/.env
   cp src/frontend/md-dashboard/.env.example src/frontend/md-dashboard/.env
   cp src/frontend/phos-admin/.env.example src/frontend/phos-admin/.env
   cp src/frontend/phos-patient-portal/.env.example src/frontend/phos-patient-portal/.env
   # Backend services (copy those you intend to run locally)
   cp src/backend/Phos.Api/.env.example src/backend/Phos.Api/.env
   cp src/backend/Phos.Identity/.env.example src/backend/Phos.Identity/.env
   cp src/backend/Phos.ApiGateway/.env.example src/backend/Phos.ApiGateway/.env
   cp src/backend/Phos.HealthScore/.env.example src/backend/Phos.HealthScore/.env
   ```
3. Install deps:
   ```bash
   make restore
   ```
4. Run locally:
   ```bash
   make dev
   ```
5. CI: Push to any branch; GitHub Actions will build/test automatically.
# Ojalá Healthcare Platform - MD Dashboard (MVP - Phase 1B)

This document provides an overview of the Minimum Viable Product (MVP) for the MD Dashboard, implemented as part of Phase 1B.

## Overview

The MD Dashboard provides physicians with a centralized interface to manage patients, view analytics, handle prescriptions, and monitor real-time alerts.

## Features Implemented (MVP)

*   **Dashboard Overview (`/`):**
    *   Displays key metrics (Active Patients, Pending Approvals, Upcoming Appointments) fetched from `/dashboard/summary`.
    *   Integrates the `EscalatedAlertsPanel` for real-time emergency alerts.
    *   Includes placeholders for other sections like Recent Activity.
*   **Patient Management (`/patients`):**
    *   Displays a table of patients fetched from `/patients`.
    *   Includes loading states (skeletons) and error handling.
    *   Provides placeholder actions (View Details, Edit, Delete) via a dropdown menu.
    *   Includes a placeholder "Add New Patient" button (form not implemented in MVP).
*   **Analytics (`/analytics`):**
    *   Displays charts for Patient Age Distribution, Monthly Appointments, and Common Condition Distribution using Recharts.
    *   Fetches data from `/analytics/demographics`, `/analytics/appointments`, and `/analytics/conditions`.
    *   Includes loading states (skeletons) and error handling.
*   **Prescription Management (`/prescriptions`):**
    *   Displays a table of prescriptions fetched from `/prescriptions`.
    *   Includes a dialog form to add new prescriptions (posts to `/prescriptions`).
    *   Includes loading states (skeletons) and error handling for both fetching and submitting.
    *   Uses badges to indicate prescription status.
*   **Real-time Alerts (`EscalatedAlertsPanel`):**
    *   Connects to a WebSocket endpoint (default: `http://localhost:5004/ws/alerts`) for real-time emergency alerts.
    *   Fetches initial alert states from `/alerts/active` and `/alerts`.
    *   Allows acknowledging active alerts (posts to `/alerts/{id}/acknowledge`).
    *   Uses authentication token for API calls and WebSocket connection.
*   **Layout & Navigation:**
    *   Basic sidebar navigation structure (`MainLayout.tsx`).
    *   Routing implemented using `react-router-dom`.
*   **Styling:**
    *   Uses Tailwind CSS with configuration aligned to the platform's shared theme.
    *   Leverages shadcn/ui components for UI elements (Table, Card, Button, Dialog, etc.).
*   **Authentication:**
    *   Basic `useAuth` hook using `localStorage` for token management (MVP implementation).
    *   `fetchWithAuth` utility for making authenticated API calls.

## Project Structure

### Frontend Applications
All frontend applications are located under `src/frontend/` with consistent kebab-case naming:

```
src/frontend/
├── phos-web/              # Provider dashboard (CRACO-based React + TypeScript)
├── patient-app/            # Patient application (React + react-scripts)
├── employer-dashboard/     # Employer dashboard (React)
├── md-dashboard/          # Medical doctor dashboard (React)
├── rn-dashboard/          # Registered nurse dashboard (React)
├── phos-admin/           # Admin interface (React)
├── phos-patient-portal/  # Patient portal (legacy React)
└── shared/                # Shared components and utilities
```

### Backend Services
Backend services are located under `src/backend/`:

```
src/backend/
├── Phos.Api/             # Main API service
├── Phos.Identity/        # Identity and authentication service
├── Phos.ApiGateway/      # API Gateway service
├── Phos.HealthScore/     # Health scoring service
├── Phos.Data/            # Data access layer
├── Phos.Services/        # Business logic services
└── [other services]/
```

## Technology Stack

### Frontend
*   React
*   TypeScript
*   Vite
*   Tailwind CSS
*   shadcn/ui
*   Recharts
*   React Router DOM
*   Socket.IO Client
*   date-fns
*   Lucide React (Icons)

### Backend
*   .NET 8
*   ASP.NET Core
*   Entity Framework Core
*   PostgreSQL
*   Redis
*   JWT Authentication

## Setup and Build Instructions

### Prerequisites
- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- .NET SDK 8.0 (for local development)

### Environment Setup
1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

## 🛠 Local Backend Dev with Hot Reload

For the best development experience with hot reload and minimal Docker overhead:

### Quick Start
```bash
# Start backend services with hot reload
./scripts/dev-start-backend.sh
```

This script:
- ✅ Starts Redis and PostgreSQL in Docker containers
- ✅ Runs Identity and API services locally with `dotnet watch run`
- ✅ Enables hot reload for instant code changes
- ✅ Sets up proper environment variables
- ✅ Provides clean, organized logging

### What's Running
- **Redis**: `localhost:6379` (Docker container)
- **PostgreSQL**: `localhost:5432` (Docker container)
- **Identity API**: `http://localhost:5501` (local with hot reload)
- **Main API**: `http://localhost:8080` (local with hot reload)

### Testing the Event-Driven Architecture
```bash
# Test the complete patient registration flow
./scripts/dev-test-patient-flow.sh
```

This tests:
- ✅ User registration via Identity API
- ✅ Event publishing to Redis
- ✅ Automatic patient creation via API
- ✅ Verification of the complete flow

### Frontend Development
Frontend applications should be run separately using their native dev servers:

```bash
# Provider Dashboard (CRACO-based)
cd src/frontend/phos-web
npm run dev

# Patient Application
cd src/frontend/patient-app
npm start

# MD Dashboard
cd src/frontend/md-dashboard
npm run dev

# RN Dashboard
cd src/frontend/rn-dashboard
npm run dev

# Employer Dashboard
cd src/frontend/employer-dashboard
npm run dev

# Admin Interface
cd src/frontend/phos-admin
npm run dev

# Patient Portal (Legacy)
cd src/frontend/phos-patient-portal
npm start
```

### Frontend Build Instructions

#### Build All Frontend Applications
Use the provided build script to build all frontend applications:

```bash
# Build all frontend applications
./scripts/build-all-frontends.sh
```

This script will:
- ✅ Automatically detect and build all frontend applications
- ✅ Install dependencies if needed
- ✅ Provide colored output and error handling
- ✅ Exit with proper status codes

#### Build Individual Applications
Each frontend application can be built independently:

```bash
# Provider Dashboard (CRACO-based)
cd src/frontend/phos-web
npm install && npm run build

# Patient Application
cd src/frontend/patient-app
npm install && npm run build

# MD Dashboard
cd src/frontend/md-dashboard
npm install && npm run build

# RN Dashboard
cd src/frontend/rn-dashboard
npm install && npm run build

# Employer Dashboard
cd src/frontend/employer-dashboard
npm install && npm run build

# Admin Interface
cd src/frontend/phos-admin
npm install && npm run build

# Patient Portal (Legacy)
cd src/frontend/phos-patient-portal
npm install && npm run build
```

### Backend Build Instructions

#### Restore and Build Solution
```bash
# Restore dependencies
dotnet restore Phos.sln

# Build the entire solution
dotnet build Phos.sln --configuration Release

# Run tests
dotnet test Phos.sln --configuration Release
```

#### Build Individual Backend Services
```bash
# Build API
dotnet build src/backend/Phos.Api/Phos.Api.csproj --configuration Release

# Build Identity Service
dotnet build src/backend/Phos.Identity/Phos.Identity.csproj --configuration Release

# Build API Gateway
dotnet build src/backend/Phos.ApiGateway/Phos.ApiGateway.csproj --configuration Release

# Build HealthScore Service
dotnet build src/backend/Phos.HealthScore/Phos.HealthScore.csproj --configuration Release
```

### Benefits of This Approach
- 🚀 **Fast startup**: No Docker builds required
- 🔄 **Hot reload**: Instant code changes
- 🐛 **Better debugging**: Direct access to logs and debugging
- 💾 **Resource efficient**: Minimal Docker overhead
- 🔧 **Flexible**: Easy to modify and test individual services

### Troubleshooting
If you encounter issues:
1. **Check services**: `docker ps` to verify Redis/PostgreSQL are running
2. **Check ports**: Ensure ports 5501, 8080, 6379, 5432 are available
3. **Restart services**: `./scripts/dev-start-backend.sh` to restart everything
4. **View logs**: Check individual service logs for errors
