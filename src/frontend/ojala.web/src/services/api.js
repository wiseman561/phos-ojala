import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add a request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't already tried to refresh the token
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // No refresh token, redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post('/api/auth/refresh', {
          refreshToken
        });

        if (response.data.success) {
          // Save the new token
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('refreshToken', response.data.refreshToken);

          // Update the authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;

          // Retry the original request
          return api(originalRequest);
        } else {
          // Refresh failed, redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API methods
export const authApi = {
  login: (email, password) => {
    return api.post('/api/auth/login', { email, password });
  },

  register: (userData) => {
    return api.post('/api/auth/register', userData);
  },

  logout: (userId) => {
    return api.post('/api/auth/logout', { userId });
  },

  getProfile: () => {
    return api.get('/api/auth/profile');
  }
};

// Patients API methods
export const patientsApi = {
  getAll: () => {
    return api.get('/api/patients');
  },

  getById: (id) => {
    return api.get(`/api/patients/${id}`);
  },

  create: (patientData) => {
    return api.post('/api/patients', patientData);
  },

  update: (id, patientData) => {
    return api.put(`/api/patients/${id}`, patientData);
  },

  delete: (id) => {
    return api.delete(`/api/patients/${id}`);
  }
};

// Appointments API methods
export const appointmentsApi = {
  getAll: () => {
    return api.get('/api/appointments');
  },

  getById: (id) => {
    return api.get(`/api/appointments/${id}`);
  },

  create: (appointmentData) => {
    return api.post('/api/appointments', appointmentData);
  },

  update: (id, appointmentData) => {
    return api.put(`/api/appointments/${id}`, appointmentData);
  },

  delete: (id) => {
    return api.delete(`/api/appointments/${id}`);
  }
};

// Medical Records API methods
export const medicalRecordsApi = {
  getAll: () => {
    return api.get('/api/medical-records');
  },

  getById: (id) => {
    return api.get(`/api/medical-records/${id}`);
  },

  getByPatientId: (patientId) => {
    return api.get(`/api/medical-records/patient/${patientId}`);
  },

  create: (recordData) => {
    return api.post('/api/medical-records', recordData);
  },

  update: (id, recordData) => {
    return api.put(`/api/medical-records/${id}`, recordData);
  },

  delete: (id) => {
    return api.delete(`/api/medical-records/${id}`);
  }
};

// Healthcare Plans API methods
export const healthcarePlansApi = {
  getAll: () => {
    return api.get('/api/healthcare-plans');
  },

  getById: (id) => {
    return api.get(`/api/healthcare-plans/${id}`);
  },

  create: (planData) => {
    return api.post('/api/healthcare-plans', planData);
  },

  update: (id, planData) => {
    return api.put(`/api/healthcare-plans/${id}`, planData);
  },

  delete: (id) => {
    return api.delete(`/api/healthcare-plans/${id}`);
  }
};

// Dashboard API methods
export const dashboardApi = {
  getData: () => {
    return api.get('/api/dashboard');
  }
};

export default api;
