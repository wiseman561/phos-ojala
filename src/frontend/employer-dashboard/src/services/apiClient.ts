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
    const tokens = localStorage.getItem('employer-dashboard-tokens');
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
        const tokens = localStorage.getItem('employer-dashboard-tokens');
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

          localStorage.setItem('employer-dashboard-tokens', JSON.stringify(newTokens));
          
          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return apiClient.request(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('employer-dashboard-tokens');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Employer-specific API endpoints
export const employerApi = {
  // Organization Management
  getOrganization: () => apiClient.get('/api/employers/organization'),
  updateOrganization: (orgData: any) => 
    apiClient.put('/api/employers/organization', orgData),
  getOrganizationSettings: () => apiClient.get('/api/employers/organization/settings'),
  updateOrganizationSettings: (settings: any) => 
    apiClient.put('/api/employers/organization/settings', settings),

  // Employee Management
  getEmployees: () => apiClient.get('/api/employers/employees'),
  getEmployeeById: (employeeId: string) => 
    apiClient.get(`/api/employers/employees/${employeeId}`),
  getEmployeeHealth: (employeeId: string) => 
    apiClient.get(`/api/employers/employees/${employeeId}/health`),
  getEmployeesByDepartment: (department: string) => 
    apiClient.get(`/api/employers/employees?department=${department}`),

  // Health Analytics & Reporting
  getHealthScoreOverview: () => apiClient.get('/api/employers/analytics/health-score'),
  getHealthTrends: (timeframe?: string) => 
    apiClient.get(`/api/employers/analytics/trends${timeframe ? `?timeframe=${timeframe}` : ''}`),
  getPopulationHealth: () => apiClient.get('/api/employers/analytics/population-health'),
  getDepartmentHealthMetrics: () => apiClient.get('/api/employers/analytics/departments'),

  // Cost Analytics
  getCostSavingsAnalysis: () => apiClient.get('/api/employers/analytics/cost-savings'),
  getHealthcareCosts: (timeframe?: string) => 
    apiClient.get(`/api/employers/costs${timeframe ? `?timeframe=${timeframe}` : ''}`),
  getProgramROI: () => apiClient.get('/api/employers/analytics/program-roi'),
  getRiskAnalysis: () => apiClient.get('/api/employers/analytics/risk'),

  // Program Management
  getWellnessPrograms: () => apiClient.get('/api/employers/programs'),
  createWellnessProgram: (programData: any) => 
    apiClient.post('/api/employers/programs', programData),
  updateWellnessProgram: (programId: string, programData: any) => 
    apiClient.put(`/api/employers/programs/${programId}`, programData),
  getProgramEffectiveness: (programId?: string) => 
    apiClient.get(`/api/employers/programs/effectiveness${programId ? `?programId=${programId}` : ''}`),
  getProgramParticipation: () => apiClient.get('/api/employers/programs/participation'),

  // Benefits Administration
  getBenefitsOverview: () => apiClient.get('/api/employers/benefits'),
  getBenefitsUtilization: () => apiClient.get('/api/employers/benefits/utilization'),
  updateBenefitsPackage: (benefitsData: any) => 
    apiClient.put('/api/employers/benefits', benefitsData),

  // Compliance & Audit
  getComplianceReport: () => apiClient.get('/api/employers/compliance'),
  getAuditLogs: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    return apiClient.get(`/api/employers/audit?${params.toString()}`);
  },
  generateComplianceReport: (reportType: string) => 
    apiClient.post('/api/employers/compliance/generate', { reportType }),

  // Alerts & Notifications
  getAlerts: () => apiClient.get('/api/employers/alerts'),
  markAlertAsRead: (alertId: string) => 
    apiClient.put(`/api/employers/alerts/${alertId}/read`),
  getNotificationSettings: () => apiClient.get('/api/employers/notifications/settings'),
  updateNotificationSettings: (settings: any) => 
    apiClient.put('/api/employers/notifications/settings', settings),

  // User Management (for HR admins)
  getUsers: () => apiClient.get('/api/employers/users'),
  createUser: (userData: any) => apiClient.post('/api/employers/users', userData),
  updateUser: (userId: string, userData: any) => 
    apiClient.put(`/api/employers/users/${userId}`, userData),
  deactivateUser: (userId: string) => 
    apiClient.put(`/api/employers/users/${userId}/deactivate`),

  // Dashboard Data
  getDashboardData: () => apiClient.get('/api/employers/dashboard'),
  getQuickStats: () => apiClient.get('/api/employers/dashboard/stats'),
  getRecentActivity: () => apiClient.get('/api/employers/dashboard/activity'),

  // Reports & Export
  exportHealthData: (format: 'csv' | 'excel' | 'pdf', filters?: any) => 
    apiClient.post('/api/employers/export/health', { format, filters }),
  exportCostAnalysis: (format: 'csv' | 'excel' | 'pdf', timeframe?: string) => 
    apiClient.post('/api/employers/export/costs', { format, timeframe }),
  getReportHistory: () => apiClient.get('/api/employers/reports/history'),

  // Integration & External Services
  getIntegrationStatus: () => apiClient.get('/api/employers/integrations'),
  updateIntegrationSettings: (integrationId: string, settings: any) => 
    apiClient.put(`/api/employers/integrations/${integrationId}`, settings),

  // Support & Help
  createSupportTicket: (ticketData: any) => 
    apiClient.post('/api/employers/support/tickets', ticketData),
  getSupportTickets: () => apiClient.get('/api/employers/support/tickets'),
  updateSupportTicket: (ticketId: string, update: any) => 
    apiClient.put(`/api/employers/support/tickets/${ticketId}`, update),
};

// Export the main client for general use
export default apiClient; 