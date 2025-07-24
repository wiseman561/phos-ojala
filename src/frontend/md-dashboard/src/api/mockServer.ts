import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { mockPatients, mockPatientDetails, PatientDetail, Patient } from '../mocks/mockPatients';
import { getAllAlerts, getActiveAlerts, getAcknowledgedAlerts, EscalatedAlert } from '../mocks/mockAlerts';
import apiClient from './axios';

// Simulate network delay
const simulateDelay = (min: number = 300, max: number = 800): Promise<void> => {
  const delay = Math.random() * (max - min) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
};

// Store to track acknowledged alerts (in real app this would be backend state)
let alertsStore = getAllAlerts();

// Store original axios methods
let originalAxiosRequest: any;
let originalAxiosGet: any;
let originalAxiosPost: any;
let originalAxiosPut: any;
let originalAxiosDelete: any;

// Store original apiClient methods
let originalApiClientRequest: any;
let originalApiClientGet: any;
let originalApiClientPost: any;
let originalApiClientPut: any;
let originalApiClientDelete: any;

let isMockServerActive = false;

// Mock server setup
export const setupMockServer = () => {
  if (isMockServerActive) {
    console.log('[Mock Server] Already active, skipping setup');
    return;
  }

  console.log('[Mock Server] Setting up mock server...');

  // Store the original axios methods
  originalAxiosRequest = axios.request;
  originalAxiosGet = axios.get;
  originalAxiosPost = axios.post;
  originalAxiosPut = axios.put;
  originalAxiosDelete = axios.delete;

  // Store the original apiClient methods
  originalApiClientRequest = apiClient.request;
  originalApiClientGet = apiClient.get;
  originalApiClientPost = apiClient.post;
  originalApiClientPut = apiClient.put;
  originalApiClientDelete = apiClient.delete;

  // Create mock response helper
  const createMockResponse = (data: any, status: number = 200, statusText: string = 'OK'): AxiosResponse => ({
    data,
    status,
    statusText,
    headers: {},
    config: {} as any,
  });

  // Shared mock request handler
  const handleMockRequest = async (config: AxiosRequestConfig): Promise<any> => {
    const { method = 'get', url = '', data } = config;
    const normalizedUrl = url.toLowerCase();

    console.log(`[Mock Server] Intercepting ${method.toUpperCase()} ${url} (${normalizedUrl})`);
    console.log(`[Mock Server] Full config:`, { method, url, baseURL: config.baseURL, data });
    console.log(`[Mock Server] Request URL: ${config.url}`);
    console.log(`[Mock Server] Base URL: ${config.baseURL}`);
    console.log(`[Mock Server] Full URL would be: ${config.baseURL}${url}`);

    try {
      // Simulate network delay
      await simulateDelay();

      // Test route to verify mock server is working
      if (method === 'get' && normalizedUrl === '/api/test') {
        console.log('[Mock Server] Test route hit - mock server is working!');
        return createMockResponse({ message: 'Mock server is working!' });
      }

      // Debug route to see all requests
      if (method === 'get' && normalizedUrl === '/api/debug') {
        console.log('[Mock Server] Debug route hit - showing all intercepted requests');
        return createMockResponse({
          message: 'Debug route working',
          timestamp: new Date().toISOString(),
          mockServerActive: isMockServerActive
        });
      }

      // Route: POST /api/auth/login (handle both with and without leading slash)
      if (method === 'post' && (normalizedUrl === '/api/auth/login' || normalizedUrl === 'api/auth/login')) {
        const { email, password } = data || {};

        console.log(`[Mock Server] Login attempt for: ${email}`);
        console.log(`[Mock Server] Request data:`, data);

        // Check credentials
        if (email === 'doctor@ojala-healthcare.com' && password === 'Password123!') {
          // Create a valid JWT token structure
          const mockJwtPayload = {
            sub: 'md123',
            email: email,
            firstName: 'Dr. Test',
            lastName: 'Physician',
            role: 'physician',
            roles: ['physician', 'doctor', 'MD', 'DO'],
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 3600
          };

          // Create a mock JWT token (base64 encoded header.payload.signature)
          const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
          const payload = btoa(JSON.stringify(mockJwtPayload));
          const signature = btoa('mock-signature-' + Date.now());
          const mockToken = `${header}.${payload}.${signature}`;

          const mockUser = {
            id: 'md123',
            email: email,
            firstName: 'Dr. Test',
            lastName: 'Physician',
            role: 'physician',
            roles: ['physician', 'doctor', 'MD', 'DO']
          };

          console.log('[Mock Server] Login successful for physician user');
          console.log('[Mock Server] Generated JWT token:', mockToken);
          console.log('[Mock Server] JWT payload:', mockJwtPayload);

          // Test JWT decode
          try {
            const testDecoded = JSON.parse(atob(payload));
            console.log('[Mock Server] JWT decode test successful:', testDecoded);
          } catch (error) {
            console.error('[Mock Server] JWT decode test failed:', error);
          }

          return createMockResponse({
            accessToken: mockToken,
            refreshToken: mockToken,
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
            user: mockUser
          });
        } else {
          console.log('[Mock Server] Login failed - invalid credentials');
          return createMockResponse(
            { message: 'Invalid email or password' },
            401,
            'Unauthorized'
          );
        }
      }

      // Route: GET /api/patients
      if (method === 'get' && normalizedUrl === '/api/patients') {
        console.log('[Mock Server] Returning mock patients');
        return createMockResponse(mockPatients);
      }

      // Route: GET /patients (without /api prefix)
      if (method === 'get' && normalizedUrl === '/patients') {
        console.log('[Mock Server] Returning mock patients (no /api prefix)');
        return createMockResponse(mockPatients);
      }

      // Route: GET /api/patients (with /api prefix)
      if (method === 'get' && normalizedUrl === '/api/patients') {
        console.log('[Mock Server] Returning mock patients (with /api prefix)');
        return createMockResponse(mockPatients);
      }

      // Catch-all for any patients request
      if (method === 'get' && (normalizedUrl.includes('patients') || url.includes('patients'))) {
        console.log('[Mock Server] Catch-all: Returning mock patients for URL:', url);
        console.log('[Mock Server] Normalized URL:', normalizedUrl);
        console.log('[Mock Server] Mock patients data:', mockPatients);
        return createMockResponse(mockPatients);
      }

      // Route: GET /api/patients/:id
      const patientDetailMatch = normalizedUrl.match(/^\/api\/patients\/(\d+)$/);
      if (method === 'get' && patientDetailMatch) {
        const patientId = parseInt(patientDetailMatch[1], 10);
        const patient = mockPatientDetails[patientId];

        if (patient) {
          return createMockResponse(patient);
        } else {
          return createMockResponse(
            { error: 'Patient not found' },
            404,
            'Not Found'
          );
        }
      }

      // Route: GET /api/alerts/escalated
      if (method === 'get' && normalizedUrl === '/api/alerts/escalated') {
        const activeAlerts = alertsStore.filter(alert => !alert.isAcknowledged);
        return createMockResponse(activeAlerts);
      }

      // Route: GET /api/alerts/active
      if (method === 'get' && normalizedUrl === '/api/alerts/active') {
        const activeAlerts = alertsStore.filter(alert => !alert.isAcknowledged);
        return createMockResponse(activeAlerts);
      }

      // Route: GET /api/alerts
      if (method === 'get' && normalizedUrl === '/api/alerts') {
        return createMockResponse(alertsStore);
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

          return createMockResponse({
            success: true,
            alert: alertsStore[alertIndex],
            id: alertId,
            acknowledgedAt: alertsStore[alertIndex].acknowledgedAt,
            acknowledgedBy: alertsStore[alertIndex].acknowledgedBy,
          });
        } else {
          return createMockResponse(
            { error: 'Alert not found' },
            404,
            'Not Found'
          );
        }
      }

      // Route: POST /api/patients/:id/assign-rn
      const assignRnMatch = normalizedUrl.match(/^\/api\/patients\/(\d+)\/assign-rn$/);
      if (method === 'post' && assignRnMatch) {
        const patientId = parseInt(assignRnMatch[1], 10);
        const patient = mockPatients.find(p => p.id === patientId);

        if (patient) {
          return createMockResponse({
            success: true,
            message: `RN assigned to ${patient.name}`,
            patientId,
          });
        } else {
          return createMockResponse(
            { error: 'Patient not found' },
            404,
            'Not Found'
          );
        }
      }

      // Route: POST /api/patients/:id/escalate
      const escalateMatch = normalizedUrl.match(/^\/api\/patients\/(\d+)\/escalate$/);
      if (method === 'post' && escalateMatch) {
        const patientId = parseInt(escalateMatch[1], 10);
        const patient = mockPatients.find(p => p.id === patientId);

        if (patient) {
          return createMockResponse({
            success: true,
            message: `${patient.name} escalated to MD`,
            patientId,
          });
        } else {
          return createMockResponse(
            { error: 'Patient not found' },
            404,
            'Not Found'
          );
        }
      }

      // Fallback: Return 404 for unhandled routes in development
      console.warn(`[Mock Server] No mock handler for ${method.toUpperCase()} ${url}`);
      console.warn(`[Mock Server] Available routes: /api/test, /api/auth/login, /api/patients, /patients, /api/alerts/*`);
      return createMockResponse(
        { error: 'Route not found in mock server', path: url, method: method.toUpperCase() },
        404,
        'Not Found'
      );

    } catch (error) {
      console.error('[Mock Server] Error:', error);
      return createMockResponse(
        { error: 'Internal server error' },
        500,
        'Internal Server Error'
      );
    }
  };

  // Override axios.request to intercept all requests
  axios.request = async (config: AxiosRequestConfig): Promise<any> => {
    return handleMockRequest(config);
  };

  // Override apiClient.request to intercept all requests
  apiClient.request = async (config: AxiosRequestConfig): Promise<any> => {
    return handleMockRequest(config);
  };

  // Override individual axios methods for convenience
  axios.get = (url: string, config?: any) =>
    axios.request({ ...config, method: 'get', url });
  axios.post = (url: string, data?: any, config?: any) =>
    axios.request({ ...config, method: 'post', url, data });
  axios.put = (url: string, data?: any, config?: any) =>
    axios.request({ ...config, method: 'put', url, data });
  axios.delete = (url: string, config?: any) =>
    axios.request({ ...config, method: 'delete', url });

  // Override individual apiClient methods for convenience
  apiClient.get = (url: string, config?: any) =>
    apiClient.request({ ...config, method: 'get', url });
  apiClient.post = (url: string, data?: any, config?: any) =>
    apiClient.request({ ...config, method: 'post', url, data });
  apiClient.put = (url: string, data?: any, config?: any) =>
    apiClient.request({ ...config, method: 'put', url, data });
  apiClient.delete = (url: string, config?: any) =>
    apiClient.request({ ...config, method: 'delete', url });

  isMockServerActive = true;
  console.log('[Mock Server] Mock server setup complete');

  // Test that our mock server is working
  console.log('[Mock Server] Testing mock server...');
  setTimeout(() => {
    axios.get('/api/test').catch(() => {
      console.log('[Mock Server] Test request intercepted successfully');
    });
  }, 1000);
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

// Function to disable mock server
export const disableMockServer = () => {
  if (originalAxiosRequest) {
    axios.request = originalAxiosRequest;
    axios.get = originalAxiosGet;
    axios.post = originalAxiosPost;
    axios.put = originalAxiosPut;
    axios.delete = originalAxiosDelete;
  }

  if (originalApiClientRequest) {
    apiClient.request = originalApiClientRequest;
    apiClient.get = originalApiClientGet;
    apiClient.post = originalApiClientPost;
    apiClient.put = originalApiClientPut;
    apiClient.delete = originalApiClientDelete;
  }

  isMockServerActive = false;
  console.log('[Mock Server] Mock server disabled');
};
