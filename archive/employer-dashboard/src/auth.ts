import { User } from './types';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export const verifyToken = async (token: string): Promise<User> => {
  const response = await fetch('/api/auth/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Token verification failed');
  }

  return response.json();
};

export const refreshToken = async (token: string): Promise<Tokens> => {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error('Token refresh failed');
  }

  return response.json();
}; 