import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: ReactNode;
  fallbackPath?: string;
}

/**
 * PrivateRoute Component for Patient App
 *
 * Protects routes by requiring patient authentication.
 * Redirects to login page if not authenticated or shows error if not a patient.
 *
 * @param children - Component(s) to render if authenticated as patient
 * @param fallbackPath - Where to redirect if not authenticated (defaults to /login)
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
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
          gap: 2,
          bgcolor: '#f8f9fa'
        }}
      >
        <CircularProgress size={48} sx={{ color: '#2e7d32' }} />
        <Typography variant="body1" color="text.secondary">
          Loading your health dashboard...
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

  // Check if user has patient role
  if (user && user.role !== 'patient') {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
          px: 3,
          bgcolor: '#f8f9fa'
        }}
      >
        <Typography variant="h5" color="error" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center">
          This application is only available to patients.
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Your current role: {user.role}
        </Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
          If you believe this is an error, please contact our support team.
        </Typography>
      </Box>
    );
  }

  // User is authenticated as a patient, render protected content
  return <>{children}</>;
};

export default PrivateRoute;
