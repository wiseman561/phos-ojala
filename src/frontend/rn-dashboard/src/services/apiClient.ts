import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Create the main API client instance
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://localhost:5001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authorization header
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const tokens = localStorage.getItem('rn-dashboard-tokens');
    if (tokens) {
      const parsedTokens = JSON.parse(tokens);
      if (parsedTokens.accessToken) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${parsedTokens.accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = localStorage.getItem('rn-dashboard-tokens');
        if (tokens) {
          const parsedTokens = JSON.parse(tokens);
          
          // Try to refresh the token
          const refreshResponse = await axios.post(
            `${process.env.REACT_APP_API_URL || 'https://localhost:5001'}/api/auth/refresh`,
            { refreshToken: parsedTokens.refreshToken }
          );

          const newTokens = {
            accessToken: refreshResponse.data.accessToken || refreshResponse.data.token,
            refreshToken: refreshResponse.data.refreshToken || parsedTokens.refreshToken,
            expiresAt: refreshResponse.data.expiresAt || new Date(Date.now() + 3600000).toISOString()
          };

          localStorage.setItem('rn-dashboard-tokens', JSON.stringify(newTokens));
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return apiClient.request(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('rn-dashboard-tokens');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Nurse-specific API endpoints
export const nurseApi = {
  // Patient Management
  getPatients: () => apiClient.get('/api/nurses/patients'),
  getPatientById: (patientId: string) => apiClient.get(`/api/patients/${patientId}`),
  getPatientsByNurse: (nurseId: string) => apiClient.get(`/api/nurses/${nurseId}/patients`),
  updatePatientStatus: (patientId: string, status: any) => 
    apiClient.put(`/api/patients/${patientId}/status`, status),

  // Alert Management
  getActiveAlerts: () => apiClient.get('/api/alerts/active'),
  getAllAlerts: () => apiClient.get('/api/alerts'),
  acknowledgeAlert: (alertId: string) => 
    apiClient.post(`/api/alerts/${alertId}/acknowledge`),
  escalateAlert: (alertId: string, escalationData: any) => 
    apiClient.post(`/api/alerts/${alertId}/escalate`, escalationData),

  // Telemetry and Monitoring
  getPatientTelemetry: (patientId: string, range?: string) =>
    apiClient.get(`/api/patients/${patientId}/telemetry${range ? `?range=${range}` : ''}`),
  getDeviceStatus: (deviceId: string) => 
    apiClient.get(`/api/devices/${deviceId}/status`),
  getPatientDevices: (patientId: string) => 
    apiClient.get(`/api/patients/${patientId}/devices`),

  // Nurse-specific Data
  getNurseProfile: () => apiClient.get('/api/nurses/profile'),
  updateNurseProfile: (profileData: any) => 
    apiClient.put('/api/nurses/profile', profileData),
  getNurseSchedule: () => apiClient.get('/api/nurses/schedule'),
  getCohortTelemetry: (nurseId: string) => 
    apiClient.get(`/api/nurses/${nurseId}/cohort-telemetry`),

  // Telehealth
  getTelehealthSessions: () => 
    apiClient.get('/api/telehealth/sessions?role=provider'),
  createTelehealthSession: (sessionData: any) => 
    apiClient.post('/api/telehealth/schedule', sessionData),
  getTelehealthSession: (sessionId: string) => 
    apiClient.get(`/api/telehealth/session/${sessionId}`),
  endTelehealthSession: (sessionId: string) => 
    apiClient.post(`/api/telehealth/end-session/${sessionId}`),
  saveTelehealthNotes: (sessionId: string, notes: string) => 
    apiClient.post(`/api/telehealth/session-notes/${sessionId}`, { notes }),

  // Messaging
  getMessages: () => apiClient.get('/api/messages'),
  sendMessage: (messageData: any) => apiClient.post('/api/messages', messageData),
  markMessageAsRead: (messageId: string) => 
    apiClient.put(`/api/messages/${messageId}/read`),

  // Documentation
  getPatientNotes: (patientId: string) => 
    apiClient.get(`/api/patients/${patientId}/notes`),
  addPatientNote: (patientId: string, note: any) => 
    apiClient.post(`/api/patients/${patientId}/notes`, note),
  updatePatientNote: (patientId: string, noteId: string, note: any) => 
    apiClient.put(`/api/patients/${patientId}/notes/${noteId}`, note),

  // Reports and Analytics
  getNurseMetrics: () => apiClient.get('/api/nurses/metrics'),
  getPatientMetrics: (patientId: string) => 
    apiClient.get(`/api/patients/${patientId}/metrics`),
  getDepartmentMetrics: () => apiClient.get('/api/departments/metrics'),

  // Emergency and Critical Care
  triggerEmergencyAlert: (patientId: string, alertData: any) => 
    apiClient.post(`/api/patients/${patientId}/emergency-alert`, alertData),
  getEmergencyProtocols: () => apiClient.get('/api/emergency/protocols'),
  activateEmergencyProtocol: (protocolId: string, patientId: string) => 
    apiClient.post(`/api/emergency/protocols/${protocolId}/activate`, { patientId }),
};

// Export the main client for general use
export default apiClient; 