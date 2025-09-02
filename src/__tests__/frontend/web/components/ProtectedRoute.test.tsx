import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useAuth } from '../../../../hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import { testA11y, mockAuthContext, mockRouter } from '../../../../utils/test-utils';

// Mock the hooks
jest.mock('../../../../hooks/useAuth');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useLocation: jest.fn()
}));

// Test component to be protected
const SecretComponent = () => <div>Secret Content</div>;

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockRouter.navigate);
    (useLocation as jest.Mock).mockReturnValue(mockRouter.location);
  });

  it('renders without accessibility violations', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: true
    });

    await testA11y(
      <ProtectedRoute>
        <SecretComponent />
      </ProtectedRoute>
    );
  });

  it('redirects to login when not authenticated', async () => {
    (useAuth as jest.Mock).mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: false
    });

    render(
      <ProtectedRoute>
        <SecretComponent />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockRouter.navigate).toHaveBeenCalledWith('/login', {
        state: { from: { pathname: '/dashboard' } }
      });
    });
  });

  it('renders children when authenticated', () => {
    (useAuth as jest.Mock).mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: true
    });

    render(
      <ProtectedRoute>
        <SecretComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText('Secret Content')).toBeInTheDocument();
  });

  it('preserves the original location in state', async () => {
    const originalPath = '/protected-page';
    (useLocation as jest.Mock).mockReturnValue({
      pathname: originalPath,
      state: null
    });

    (useAuth as jest.Mock).mockReturnValue({
      ...mockAuthContext,
      isAuthenticated: false
    });

    render(
      <ProtectedRoute>
        <SecretComponent />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(mockRouter.navigate).toHaveBeenCalledWith('/login', {
        state: { from: { pathname: originalPath } }
      });
    });
  });

  it('shows loading state while checking authentication', () => {
    (useAuth as jest.Mock).mockReturnValue({
      ...mockAuthContext,
      loading: true
    });

    render(
      <ProtectedRoute>
        <SecretComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('handles error state', () => {
    const errorMessage = 'Authentication error';
    (useAuth as jest.Mock).mockReturnValue({
      ...mockAuthContext,
      error: errorMessage
    });

    render(
      <ProtectedRoute>
        <SecretComponent />
      </ProtectedRoute>
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });
});