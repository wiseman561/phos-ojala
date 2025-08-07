# MD Dashboard Service Abstraction Layer

This document describes the new service abstraction layer that allows the MD Dashboard to easily switch between mock and real backend APIs.

## Overview

The MD Dashboard now uses a service abstraction layer that provides a unified interface for both mock and real data sources. This allows for:

- **Development**: Use mock data for faster development and testing
- **Production**: Seamlessly switch to real backend APIs
- **Testing**: Easy mocking for unit and integration tests

## Environment Configuration

### Development (Mock Mode)
Set `REACT_APP_USE_MOCKS=true` in `.env.development`:
```env
REACT_APP_USE_MOCKS=true
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ALERTS_STREAMER_URL=http://localhost:5004
REACT_APP_SIGNALR_URL=http://localhost:5000/hubs/alerts
```

### Production (Real API Mode)
Set `REACT_APP_USE_MOCKS=false` in `.env.production`:
```env
REACT_APP_USE_MOCKS=false
REACT_APP_API_URL=https://api.phos-healthcare.com
REACT_APP_SIGNALR_URL=https://api.phos-healthcare.com/hubs/alerts
```

## Services

### PatientService

Handles all patient-related operations.

**Location**: `src/services/patientService.ts`

**Methods**:
- `getPatients()`: Get all patients
- `getPatientDetail(patientId)`: Get detailed patient information
- `assignRN(patientId)`: Assign RN to patient
- `escalatePatient(patientId)`: Escalate patient to MD

**Usage**:
```typescript
import { patientService } from '../services';

// Get all patients
const patients = await patientService.getPatients();

// Get patient details
const patient = await patientService.getPatientDetail(1);

// Assign RN
const result = await patientService.assignRN(1);

// Escalate patient
const result = await patientService.escalatePatient(1);
```

### AlertService

Handles all alert-related operations including real-time notifications.

**Location**: `src/services/alertService.ts`

**Methods**:
- `subscribeToAlerts(callback)`: Subscribe to real-time alerts
- `connect()`: Connect to SignalR hub (real mode) or simulate connection (mock mode)
- `disconnect()`: Disconnect from SignalR
- `getAlerts()`: Get all alerts
- `getActiveAlerts()`: Get unacknowledged alerts
- `getAcknowledgedAlerts()`: Get acknowledged alerts
- `acknowledgeAlert(alertId)`: Acknowledge an alert
- `isConnectedToRealTime()`: Check connection status

**Usage**:
```typescript
import { alertService } from '../services';

// Subscribe to real-time alerts
const unsubscribe = alertService.subscribeToAlerts((alert) => {
  console.log('New alert:', alert);
});

// Connect to real-time service
await alertService.connect();

// Get active alerts
const activeAlerts = await alertService.getActiveAlerts();

// Acknowledge an alert
const result = await alertService.acknowledgeAlert('alert-123');

// Cleanup
unsubscribe();
await alertService.disconnect();
```

## Migration Guide

### Before (Direct API Calls)
```typescript
import apiClient from '../api/axios';

// Fetch patients
const response = await apiClient.get('/patients');
const patients = response.data;

// Fetch patient details
const response = await apiClient.get(`/patients/${patientId}`);
const patient = response.data;
```

### After (Service Layer)
```typescript
import { patientService } from '../services';

// Fetch patients
const patients = await patientService.getPatients();

// Fetch patient details
const patient = await patientService.getPatientDetail(patientId);
```

## Mock Data

### Patient Mock Data
- **Location**: `src/mocks/mockPatients.ts`
- **Types**: `Patient`, `PatientDetail`
- **Data**: 10 mock patients with full details

### Alert Mock Data
- **Location**: `src/mocks/mockAlerts.ts`
- **Types**: `EscalatedAlert`
- **Data**: Active and acknowledged alerts with realistic scenarios

## Real-Time Features

### Mock Mode
- Simulates SignalR connection
- Generates mock alerts at intervals
- Provides realistic timing delays

### Real Mode
- Connects to actual SignalR hub at `/hubs/alerts`
- Receives real-time alerts from backend
- Handles connection failures and reconnection

## Testing

The service abstraction makes testing easier:

```typescript
// Mock the service for testing
jest.mock('../services/patientService', () => ({
  patientService: {
    getPatients: jest.fn().mockResolvedValue(mockPatients),
    getPatientDetail: jest.fn().mockResolvedValue(mockPatientDetails[1]),
  }
}));
```

## Benefits

1. **Development Speed**: No need to wait for backend during development
2. **Consistent Interface**: Same API regardless of data source
3. **Easy Testing**: Mock services for unit tests
4. **Production Ready**: Seamless switch to real APIs
5. **Type Safety**: Full TypeScript support
6. **Error Handling**: Centralized error handling in services

## Troubleshooting

### Mock Mode Not Working
1. Check `REACT_APP_USE_MOCKS=true` in environment
2. Verify service initialization logs in console
3. Check for TypeScript compilation errors

### Real API Mode Not Working
1. Check `REACT_APP_USE_MOCKS=false` in environment
2. Verify API endpoints are accessible
3. Check network connectivity and CORS settings
4. Verify authentication tokens

### SignalR Connection Issues
1. Check hub URL configuration
2. Verify backend SignalR hub is running
3. Check authentication headers
4. Review browser console for connection errors 
