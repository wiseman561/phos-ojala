import axios, { AxiosInstance } from 'axios';

// Create a general API client instance for non-auth requests
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || process.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Function to set authorization token for this api instance
export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

// Request interceptor to automatically inject tokens
apiClient.interceptors.request.use(
  (config) => {
    // If no Authorization header is set, try to get token from localStorage
    if (!config.headers.Authorization) {
      try {
        const tokens = localStorage.getItem('phos_admin_tokens');
        if (tokens) {
          const parsedTokens = JSON.parse(tokens);
          config.headers.Authorization = `Bearer ${parsedTokens.accessToken}`;
        }
      } catch (error) {
        console.warn('Could not parse tokens from localStorage:', error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized - Invalid or expired token');
      // Note: AuthContext will handle the actual logout/refresh logic
      // Redirect to login will be handled by AuthContext
    }
    return Promise.reject(error);
  }
);

// Admin-specific API methods
export const adminApi = {
  // Users management
  users: {
    getAll: () => apiClient.get('/api/admin/users'),
    getById: (id: string) => apiClient.get(`/api/admin/users/${id}`),
    create: (userData: any) => apiClient.post('/api/admin/users', userData),
    update: (id: string, userData: any) => apiClient.put(`/api/admin/users/${id}`, userData),
    delete: (id: string) => apiClient.delete(`/api/admin/users/${id}`),
    updateRole: (id: string, role: string) => apiClient.patch(`/api/admin/users/${id}/role`, { role }),
    resetPassword: (id: string) => apiClient.post(`/api/admin/users/${id}/reset-password`),
  },

  // Patients management
  patients: {
    getAll: (params?: any) => apiClient.get('/api/admin/patients', { params }),
    getById: (id: string) => apiClient.get(`/api/admin/patients/${id}`),
    create: (patientData: any) => apiClient.post('/api/admin/patients', patientData),
    update: (id: string, patientData: any) => apiClient.put(`/api/admin/patients/${id}`, patientData),
    delete: (id: string) => apiClient.delete(`/api/admin/patients/${id}`),
    getHealthScore: (id: string) => apiClient.get(`/api/admin/patients/${id}/health-score`),
  },

  // Alerts management
  alerts: {
    getAll: (params?: any) => apiClient.get('/api/admin/alerts', { params }),
    getById: (id: string) => apiClient.get(`/api/admin/alerts/${id}`),
    create: (alertData: any) => apiClient.post('/api/admin/alerts', alertData),
    update: (id: string, alertData: any) => apiClient.put(`/api/admin/alerts/${id}`, alertData),
    delete: (id: string) => apiClient.delete(`/api/admin/alerts/${id}`),
    acknowledge: (id: string) => apiClient.patch(`/api/admin/alerts/${id}/acknowledge`),
    resolve: (id: string) => apiClient.patch(`/api/admin/alerts/${id}/resolve`),
  },

  // System logs
  logs: {
    getAll: (params?: any) => apiClient.get('/api/admin/logs', { params }),
    getById: (id: string) => apiClient.get(`/api/admin/logs/${id}`),
    export: (params?: any) => apiClient.get('/api/admin/logs/export', { params, responseType: 'blob' }),
  },

  // Settings management
  settings: {
    get: (section: string) => apiClient.get(`/api/admin/settings/${section}`),
    update: (section: string, settings: any) => apiClient.put(`/api/admin/settings/${section}`, settings),
    reset: (section: string) => apiClient.delete(`/api/admin/settings/${section}`),
  },

  // Platform management
  platform: {
    getStatus: () => apiClient.get('/api/admin/platform/status'),
    toggleMaintenance: (enabled: boolean) => apiClient.post('/api/admin/platform/maintenance', { enabled }),
    getMetrics: () => apiClient.get('/api/admin/platform/metrics'),
    exportData: (params?: any) => apiClient.get('/api/admin/platform/export', { params, responseType: 'blob' }),
  },

  // Dashboard data
  dashboard: {
    getStats: () => apiClient.get('/api/admin/dashboard/stats'),
    getRecentActivity: () => apiClient.get('/api/admin/dashboard/recent-activity'),
    getChartData: (chartType: string, params?: any) => apiClient.get(`/api/admin/dashboard/charts/${chartType}`, { params }),
  },
};

export default apiClient;
