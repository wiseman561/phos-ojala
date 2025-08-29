import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Create the main API client instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5010',
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT || '30000'),
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Request interceptor to add auth token and logging
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Add debug logging in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }

    // Add auth token if available
    const tokens = localStorage.getItem('patient-portal-tokens');
    if (tokens) {
      try {
        const parsedTokens = JSON.parse(tokens);
        if (parsedTokens.accessToken) {
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${parsedTokens.accessToken}`,
          };
        }
      } catch (error) {
        console.error('Error parsing auth tokens:', error);
      }
    }

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful responses in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = localStorage.getItem('patient-portal-tokens');
        if (tokens) {
          const parsedTokens = JSON.parse(tokens);
          if (parsedTokens.refreshToken) {
            // Attempt to refresh the token
            const refreshResponse = await axios.post(
              `${process.env.REACT_APP_API_URL}/api/auth/refresh`,
              { refreshToken: parsedTokens.refreshToken },
              { timeout: 10000 }
            );

            if (refreshResponse.data.accessToken) {
              // Update stored tokens
              const newTokens = {
                accessToken: refreshResponse.data.accessToken,
                refreshToken: refreshResponse.data.refreshToken || parsedTokens.refreshToken,
                expiresAt: refreshResponse.data.expiresAt || new Date(Date.now() + 3600000).toISOString()
              };

              localStorage.setItem('patient-portal-tokens', JSON.stringify(newTokens));

              // Update the authorization header
              originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;

              // Retry the original request
              return apiClient(originalRequest);
            }
          }
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);

        // Clear invalid tokens
        localStorage.removeItem('patient-portal-tokens');

        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    // Log errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
    }

    return Promise.reject(error);
  }
);

// Patient Portal API endpoints
export const patientApi = {
  // Authentication
  auth: {
    login: (email: string, password: string) =>
      apiClient.post('/api/auth/login', { email, password, role: 'patient' }),
    register: (userData: any) =>
      apiClient.post('/api/auth/register', { ...userData, role: 'patient' }),
    logout: (refreshToken: string) =>
      apiClient.post('/api/auth/logout', { refreshToken }),
    refresh: (refreshToken: string) =>
      apiClient.post('/api/auth/refresh', { refreshToken }),
    forgotPassword: (email: string) =>
      apiClient.post('/api/auth/forgot-password', { email }),
    resetPassword: (token: string, password: string) =>
      apiClient.post('/api/auth/reset-password', { token, password }),
  },

  // Patient Profile
  patient: {
    getProfile: () =>
      apiClient.get('/api/patient/profile'),
    updateProfile: (data: any) =>
      apiClient.put('/api/patient/profile', data),
    getDashboard: () =>
      apiClient.get('/api/patient/dashboard'),
    getHealthScore: () =>
      apiClient.get('/api/patient/health-score'),
  },

  // Telemetry & Monitoring
  telemetry: {
    getDevices: () =>
      apiClient.get('/api/devices'),
    getDeviceTelemetry: (deviceId: string, params?: any) =>
      apiClient.get(`/api/devices/${deviceId}/telemetry`, { params }),
    analyzeData: (data: any) =>
      apiClient.post('/api/telemetry/analyze', data),
    getRealTimeData: (deviceId: string) =>
      apiClient.get(`/api/devices/${deviceId}/realtime`),
  },

  // Telehealth
  telehealth: {
    getSessions: (role: string = 'patient') =>
      apiClient.get('/api/telehealth/sessions', { params: { role } }),
    scheduleSession: (data: any) =>
      apiClient.post('/api/telehealth/schedule', data),
    joinSession: (sessionId: string) =>
      apiClient.get(`/api/telehealth/join/${sessionId}`),
    getSessionHistory: () =>
      apiClient.get('/api/telehealth/history'),
  },

  // Omics & Genomics
  omics: {
    uploadFiles: (files: FormData) =>
      apiClient.post('/api/omics/upload', files, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    analyzeData: (data: any) =>
      apiClient.post('/api/omics/analyze', data),
    getHistory: () =>
      apiClient.get('/api/omics/history'),
    getInsights: (analysisId: string) =>
      apiClient.get(`/api/omics/insights/${analysisId}`),
  },

  // Messaging
  messaging: {
    getThreads: () =>
      apiClient.get('/api/messages/threads'),
    getMessages: (threadId: string) =>
      apiClient.get(`/api/messages/threads/${threadId}`),
    sendMessage: (threadId: string, message: string, attachments?: any[]) =>
      apiClient.post(`/api/messages/threads/${threadId}`, { message, attachments }),
    createThread: (providerId: string, subject: string, message: string) =>
      apiClient.post('/api/messages/threads', { providerId, subject, message }),
    markAsRead: (messageId: string) =>
      apiClient.put(`/api/messages/${messageId}/read`),
  },

  // Appointments
  appointments: {
    getUpcoming: () =>
      apiClient.get('/api/appointments/upcoming'),
    getHistory: () =>
      apiClient.get('/api/appointments/history'),
    schedule: (data: any) =>
      apiClient.post('/api/appointments', data),
    cancel: (appointmentId: string) =>
      apiClient.delete(`/api/appointments/${appointmentId}`),
    reschedule: (appointmentId: string, newDateTime: string) =>
      apiClient.put(`/api/appointments/${appointmentId}`, { dateTime: newDateTime }),
  },

  // Care Plans
  carePlans: {
    getActive: () =>
      apiClient.get('/api/care-plans'),
    getDetails: (planId: string) =>
      apiClient.get(`/api/care-plans/${planId}`),
    updateProgress: (planId: string, progressData: any) =>
      apiClient.post(`/api/care-plans/${planId}/progress`, progressData),
    getReminders: (planId: string) =>
      apiClient.get(`/api/care-plans/${planId}/reminders`),
    markReminderComplete: (reminderId: string) =>
      apiClient.put(`/api/care-plans/reminders/${reminderId}/complete`),
  },

  // Health Records
  healthRecords: {
    getVitals: (params?: any) =>
      apiClient.get('/api/health-records/vitals', { params }),
    getLabs: (params?: any) =>
      apiClient.get('/api/health-records/labs', { params }),
    getMedications: () =>
      apiClient.get('/api/health-records/medications'),
    getAllergies: () =>
      apiClient.get('/api/health-records/allergies'),
    getConditions: () =>
      apiClient.get('/api/health-records/conditions'),
  },
};

// Helper function to handle API errors
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  if (error.response?.status === 401) {
    return 'Session expired. Please login again.';
  }

  if (error.response?.status === 403) {
    return 'Access denied. You do not have permission to perform this action.';
  }

  if (error.response?.status === 404) {
    return 'The requested resource was not found.';
  }

  if (error.response?.status === 500) {
    return 'Server error. Please try again later.';
  }

  if (error.code === 'NETWORK_ERROR') {
    return 'Network error. Please check your internet connection.';
  }

  return error.message || 'An unexpected error occurred.';
};

export default apiClient;
