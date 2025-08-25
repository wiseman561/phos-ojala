import axios from 'axios';

// Seed a fake token for now
if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
  localStorage.setItem('token', 'dev-token');
}

export const api = axios.create({
  baseURL: '/api',
});

// Attach Authorization header if token available
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

export async function postLabInterpret(payload: unknown) {
  const res = await api.post('/labs/interpret', payload);
  return res.data;
}

export async function postNutritionAnalyze(payload: unknown) {
  const res = await api.post('/nutrition/analyze', payload);
  return res.data;
}
