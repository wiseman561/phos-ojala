import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { mockPatients, mockPatientDetails, PatientDetail, Patient } from '../mocks/mockPatients';
import { getAllAlerts, getActiveAlerts, getAcknowledgedAlerts, EscalatedAlert } from '../mocks/mockAlerts';
import { AxiosAdapter } from 'axios';

// Simulate network delay
const simulateDelay = (min: number = 300, max: number = 800): Promise<void> => {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Store to track acknowledged alerts (in real app this would be backend state)
let alertsStore = getAllAlerts();

// Mock server setup
export const setupMockServer = () => {
  // Store original axios adapter
  const originalAdapter = axios.defaults.adapter;

  // Override axios adapter to intercept requests
  axios.defaults.adapter = async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
    const { method = 'get', url = '', data } = config;
    const normalizedUrl = url.toLowerCase();

    console.log(`[Mock Server] Intercepting ${method.toUpperCase()} ${url}`);

    try {
      // Simulate network delay
      await simulateDelay();

      // Route: GET /api/patients
      if (method === 'get' && normalizedUrl === '/api/patients') {
        return {
          data: mockPatients,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        } as AxiosResponse<Patient[]>;
      }

      // Route: GET /api/patients/:id
      const patientDetailMatch = normalizedUrl.match(/^\/api\/patients\/(\d+)$/);
      if (method === 'get' && patientDetailMatch) {
        const patientId = parseInt(patientDetailMatch[1], 10);
        const patient = mockPatientDetails[patientId];

        if (patient) {
          return {
            data: patient,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          } as AxiosResponse<PatientDetail>;
        } else {
          return {
            data: { error: 'Patient not found' },
            status: 404,
            statusText: 'Not Found',
            headers: {},
            config,
          } as AxiosResponse;
        }
      }

      // Route: GET /api/alerts/escalated
      if (method === 'get' && normalizedUrl === '/api/alerts/escalated') {
        const activeAlerts = alertsStore.filter(alert => !alert.isAcknowledged);
        return {
          data: activeAlerts,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        } as AxiosResponse<EscalatedAlert[]>;
      }

      // Route: GET /api/alerts/active
      if (method === 'get' && normalizedUrl === '/api/alerts/active') {
        const activeAlerts = alertsStore.filter(alert => !alert.isAcknowledged);
        return {
          data: activeAlerts,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        } as AxiosResponse<EscalatedAlert[]>;
      }

      // Route: GET /api/alerts
      if (method === 'get' && normalizedUrl === '/api/alerts') {
        return {
          data: alertsStore,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        } as AxiosResponse<EscalatedAlert[]>;
      }

      // Route: POST /api/alerts/:id/acknowledge
      const acknowledgeMatch = normalizedUrl.match(/^\/api\/alerts\/([^\/]+)\/acknowledge$/);
      if (method === 'post' && acknowledgeMatch) {
        const alertId = acknowledgeMatch[1];
        const alertIndex = alertsStore.findIndex(alert => alert.id === alertId);

        if (alertIndex !== -1) {
          // Update the alert as acknowledged
          alertsStore[alertIndex] = {
            ...alertsStore[alertIndex],
            isAcknowledged: true,
            acknowledgedAt: new Date().toISOString(),
            acknowledgedBy: 'Dr. Sarah Wilson', // Mock user
          };

          return {
            data: {
              success: true,
              alert: alertsStore[alertIndex],
              id: alertId,
              acknowledgedAt: alertsStore[alertIndex].acknowledgedAt,
              acknowledgedBy: alertsStore[alertIndex].acknowledgedBy,
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          } as AxiosResponse;
        } else {
          return {
            data: { error: 'Alert not found' },
            status: 404,
            statusText: 'Not Found',
            headers: {},
            config,
          } as AxiosResponse;
        }
      }

      // Route: POST /api/patients/:id/assign-rn
      const assignRnMatch = normalizedUrl.match(/^\/api\/patients\/(\d+)\/assign-rn$/);
      if (method === 'post' && assignRnMatch) {
        const patientId = parseInt(assignRnMatch[1], 10);
        const patient = mockPatients.find(p => p.id === patientId);

        if (patient) {
          return {
            data: {
              success: true,
              message: `RN assigned to ${patient.name}`,
              patientId,
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          } as AxiosResponse;
        } else {
          return {
            data: { error: 'Patient not found' },
            status: 404,
            statusText: 'Not Found',
            headers: {},
            config,
          } as AxiosResponse;
        }
      }

      // Route: POST /api/patients/:id/escalate
      const escalateMatch = normalizedUrl.match(/^\/api\/patients\/(\d+)\/escalate$/);
      if (method === 'post' && escalateMatch) {
        const patientId = parseInt(escalateMatch[1], 10);
        const patient = mockPatients.find(p => p.id === patientId);

        if (patient) {
          return {
            data: {
              success: true,
              message: `${patient.name} escalated to MD`,
              patientId,
            },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          } as AxiosResponse;
        } else {
          return {
            data: { error: 'Patient not found' },
            status: 404,
            statusText: 'Not Found',
            headers: {},
            config,
          } as AxiosResponse;
        }
      }

      // Fallback: Use original adapter for unhandled routes
      console.warn(`[Mock Server] No mock handler for ${method.toUpperCase()} ${url}, falling back to real request`);

      // Return to original adapter
      if (originalAdapter) {
        return (originalAdapter as AxiosAdapter)(config as any);

      }

      // If no original adapter, return 404
      return {
        data: { error: 'Route not found' },
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config,
      } as AxiosResponse;

    } catch (error) {
      console.error('[Mock Server] Error:', error);
      return {
        data: { error: 'Internal server error' },
        status: 500,
        statusText: 'Internal Server Error',
        headers: {},
        config,
      } as AxiosResponse;
    }
  };

  console.log('[Mock Server] Mock server setup complete');
};

// Function to reset mock server (useful for testing)
export const resetMockServer = () => {
  alertsStore = getAllAlerts();
  console.log('[Mock Server] Mock server reset');
};

// Function to add a new alert (for testing dynamic alerts)
export const addMockAlert = (alert: EscalatedAlert) => {
  alertsStore.unshift(alert);
  console.log('[Mock Server] Added new alert:', alert.id);
};
