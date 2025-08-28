import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../contexts/auth/AuthContext';

interface PrivateRouteProps {
  children: ReactNode;
  requiredRole?: 'physician' | 'md' | 'doctor';
  fallbackPath?: string;
}

/**
 * PrivateRoute Component
 *
 * Protects routes by requiring authentication and optionally specific roles.
 * Redirects to login page if not authenticated or shows error if role is insufficient.
 *
 * @param children - Component(s) to render if authenticated
 * @param requiredRole - Optional role requirement (defaults to any physician role)
 * @param fallbackPath - Where to redirect if not authenticated (defaults to /login)
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  requiredRole,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth state is being determined
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          Authenticating...
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate
        to={fallbackPath}
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  // Check role requirements if specified
  if (requiredRole && user) {
    console.log('[PrivateRoute] Checking role requirements:', {
      requiredRole,
      userRole: user.role,
      userRoles: user.roles,
      user: user
    });

    const hasRequiredRole = user.role === requiredRole ||
                           (requiredRole === 'physician' && ['physician', 'md', 'doctor'].includes(user.role));

    console.log('[PrivateRoute] Role check result:', { hasRequiredRole, userRole: user.role, requiredRole });

    if (!hasRequiredRole) {
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            gap: 2,
            px: 3
          }}
        >
          <Typography variant="h5" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            You don't have the required permissions to access this page.
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Required role: {requiredRole}
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center">
            Your role: {user.role}
          </Typography>
        </Box>
      );
    }
  }

  // User is authenticated and has required role, render protected content
  return <>{children}</>;
};

export default PrivateRoute;
