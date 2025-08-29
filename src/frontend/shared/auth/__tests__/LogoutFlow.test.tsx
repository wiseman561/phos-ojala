import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { render, testA11y, mockAuthContext, mockRouter } from '@testing';
import { LogoutButton } from '../components/LogoutButton';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../api/authApi';

// Mock the useAuth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: jest.fn()
}));

// Mock the authApi
jest.mock('../api/authApi', () => ({
  authApi: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn()
  }
}));

describe('LogoutFlow', () => {
  const mockLogout = jest.fn();
  const mockNavigate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Setup default mock implementations
    (useAuth as jest.Mock).mockReturnValue({
      ...mockAuthContext,
      logout: mockLogout
    });
    mockRouter.navigate = mockNavigate;
  });

  describe('LogoutButton', () => {
    it('should be accessible', async () => {
      await testA11y(<LogoutButton />);
    });

    it('should call logout and redirect on click', async () => {
      render(<LogoutButton />);
      
      const button = screen.getByRole('button', { name: /logout/i });
      button.click();

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should show loading state while logging out', async () => {
      mockLogout.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      render(<LogoutButton />);
      
      const button = screen.getByRole('button', { name: /logout/i });
      button.click();

      expect(button).toBeDisabled();
      expect(screen.getByText(/logging out/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('Auto-Logout on 401', () => {
    it('should trigger logout on 401 response', async () => {
      // Mock a protected API call returning 401
      (authApi.get as jest.Mock).mockRejectedValueOnce({
        response: { status: 401 }
      });

      try {
        await authApi.get('/protected-route');
      } catch (error) {
        // Expected error
      }

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should clear storage on 401 response', async () => {
      const mockLocalStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn()
      };
      Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

      // Mock a protected API call returning 401
      (authApi.get as jest.Mock).mockRejectedValueOnce({
        response: { status: 401 }
      });

      try {
        await authApi.get('/protected-route');
      } catch (error) {
        // Expected error
      }

      await waitFor(() => {
        expect(mockLocalStorage.clear).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle network errors without triggering logout', async () => {
      // Mock a network error
      (authApi.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      try {
        await authApi.get('/protected-route');
      } catch (error) {
        // Expected error
      }

      expect(mockLogout).not.toHaveBeenCalled();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
}); 