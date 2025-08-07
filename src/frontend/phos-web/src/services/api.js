import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Note: Authentication is now handled by AuthContext.tsx
// The AuthContext sets up its own axios instance with token management
// This api instance is for general use and will inherit auth headers when needed

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

// Function to set auth token for this api instance
// This can be called by AuthContext to sync tokens
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;
