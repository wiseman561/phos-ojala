import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  fallbackPath?: string;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  fallbackPath = '/login'
}: ProtectedRouteProps) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while auth state is being determined
  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace state={{ from: location }} />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles && allowedRoles.length > 0) {
    const userRoles = user?.roles || (user?.role ? [user.role] : []);
    const hasRequiredRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      return (
        <Box sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 5 }}>
          <Alert severity="error">
            <strong>Access Denied</strong>
            <br />
            You don't have permission to view this page. Required roles: {allowedRoles.join(', ')}
            <br />
            Your roles: {userRoles.length > 0 ? userRoles.join(', ') : 'None'}
          </Alert>
        </Box>
      );
    }
  }

  // User is authenticated and has required role (if specified), render protected content
  return <>{children}</>;
}

export default ProtectedRoute;
