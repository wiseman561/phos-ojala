import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
});

export async function postLabInterpret(payload: unknown) {
  const res = await api.post('/labs/interpret', payload);
  return res.data;
}
