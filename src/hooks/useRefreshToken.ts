import { useCallback } from 'react';
import { authApi, AuthResponse } from '../frontend/shared/api/authApi';

export interface UseRefreshTokenReturn {
  refreshToken: () => Promise<AuthResponse>;
}

export const useRefreshToken = (
  setAuthState?: (callback: (prev: any) => any) => void,
  redirect?: () => void
): UseRefreshTokenReturn => {
  const refreshToken = useCallback(async (): Promise<AuthResponse> => {
    try {
      const response = await authApi.refresh();
      
      // Update token in localStorage
      localStorage.setItem('authToken', response.token);
      
      // Update auth state if callback provided
      if (setAuthState) {
        setAuthState((prev: any) => ({
          ...prev,
          user: response.user,
          token: response.token,
          isAuthenticated: true
        }));
      }
      
      return response;
    } catch (error) {
      // Token refresh failed, redirect to login
      localStorage.removeItem('authToken');
      
      if (setAuthState) {
        setAuthState((prev: any) => ({
          ...prev,
          user: null,
          token: null,
          isAuthenticated: false
        }));
      }
      
      if (redirect) {
        redirect();
      }
      
      throw error;
    }
  }, [setAuthState, redirect]);

  return { refreshToken };
};
