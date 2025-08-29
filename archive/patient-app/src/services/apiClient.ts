import axios, { AxiosResponse, AxiosError } from 'axios';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://localhost:5001',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Function to set authorization token
export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

// Request interceptor to add token and logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`[Patient API Request] ${config.method?.toUpperCase()} ${config.url}`);

    // Try to get token from localStorage if not already set
    if (!config.headers.Authorization) {
      const savedTokens = localStorage.getItem('patient-app-tokens');
      if (savedTokens) {
        try {
          const tokens = JSON.parse(savedTokens);
          if (tokens.accessToken) {
            config.headers.Authorization = `Bearer ${tokens.accessToken}`;
          }
        } catch (error) {
          console.warn('Failed to parse saved tokens');
        }
      }
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('[Patient API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`[Patient API Response] ${response.status} ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
    console.error('[Patient API Response Error]', error);

    // Handle common error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 401:
          console.error('Unauthorized - Invalid or expired token');
          // Clear invalid tokens
          localStorage.removeItem('patient-app-tokens');
          // Redirect to login will be handled by AuthContext
          break;
        case 403:
          console.error('Forbidden - Access denied');
          break;
        case 404:
          console.error('Not Found - Resource does not exist');
          break;
        case 429:
          console.error('Too Many Requests - Rate limit exceeded');
          break;
        case 500:
          console.error('Internal Server Error');
          break;
        case 503:
          console.error('Service Unavailable');
          break;
        default:
          console.error(`API Error ${status}:`, data);
      }
    } else if (error.request) {
      // Network error
      console.error('Network Error - No response received');
    } else {
      // Request configuration error
      console.error('Request Error:', error.message);
    }

    return Promise.reject(error);
  }
);

// API service methods
export const patientApi = {
  // Health Data
  getHealthScore: () => apiClient.get('/api/health/score'),
  getVitals: () => apiClient.get('/api/health/vitals'),
  addVital: (data: any) => apiClient.post('/api/health/vitals', data),

  // Appointments
  getAppointments: () => apiClient.get('/api/appointments'),
  scheduleAppointment: (data: any) => apiClient.post('/api/appointments', data),
  cancelAppointment: (id: string) => apiClient.delete(`/api/appointments/${id}`),

  // Messages
  getMessages: () => apiClient.get('/api/messages'),
  sendMessage: (data: any) => apiClient.post('/api/messages', data),
  markMessageRead: (id: string) => apiClient.patch(`/api/messages/${id}/read`),

  // Profile
  getProfile: () => apiClient.get('/api/profile'),
  updateProfile: (data: any) => apiClient.put('/api/profile', data),

  // Care Team
  getCareTeam: () => apiClient.get('/api/care-team'),

  // Medications
  getMedications: () => apiClient.get('/api/medications'),
  addMedication: (data: any) => apiClient.post('/api/medications', data),

  // Lab Results
  getLabResults: () => apiClient.get('/api/lab-results'),

  // Emergency Contacts
  getEmergencyContacts: () => apiClient.get('/api/emergency-contacts'),
  updateEmergencyContact: (id: string, data: any) => apiClient.put(`/api/emergency-contacts/${id}`, data),
};

export default apiClient;
