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

## Technology Stack

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
# MD Dashboard
cd src/frontend/md-dashboard
npm run dev

# Patient Portal
cd src/frontend/Ojala.PatientPortal
npm start

# RN Dashboard
cd src/frontend/rn-dashboard
npm run dev
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
