import { useState, useEffect, useCallback } from 'react';
import { authApi, User, AuthResponse } from '../frontend/shared/api/authApi';

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UseAuthReturn extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: any) => Promise<void>;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: localStorage.getItem('authToken'),
    isAuthenticated: false,
    isLoading: false,
    error: null
  });

  // Check if user is authenticated on mount
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      setAuthState(prev => ({
        ...prev,
        token,
        isAuthenticated: true
      }));

      // Optionally verify token with server
      authApi.getProfile()
        .then(user => {
          setAuthState(prev => ({
            ...prev,
            user,
            isAuthenticated: true,
            isLoading: false
          }));
        })
        .catch(() => {
          // Token invalid, clear it
          localStorage.removeItem('authToken');
          setAuthState(prev => ({
            ...prev,
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          }));
        });
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response: AuthResponse = await authApi.login(email, password);

      localStorage.setItem('authToken', response.token);

      setAuthState({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Login failed'
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      if (authState.user?.id) {
        await authApi.logout(authState.user.id);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('authToken');
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
    }
  }, [authState.user?.id]);

  const register = useCallback(async (userData: any) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await authApi.register(userData);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error: any) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Registration failed'
      }));
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...authState,
    login,
    logout,
    register,
    clearError
  };
};
