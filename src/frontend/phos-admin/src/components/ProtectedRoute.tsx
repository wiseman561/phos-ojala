import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Alert, Button } from '@mui/material';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import { useAuth, ROLES } from '../contexts/AuthContext';
import { useMaintenanceMode } from '../hooks/useMaintenanceMode';

type UserRole = typeof ROLES[keyof typeof ROLES];

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, user, isLoading: authLoading, hasRole } = useAuth();
  const { canAccess, isMaintenanceMode } = useMaintenanceMode();
  const location = useLocation();

  // Show loading spinner while auth state is being determined
  if (authLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: 'grey.100'
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Box sx={{ mt: 2 }}>
            <div className="text-gray-600 dark:text-gray-400">Loading...</div>
          </Box>
        </Box>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace state={{ from: location }} />;
  }

  // Check maintenance mode first
  if (!canAccess) {
    return <Navigate to="/maintenance" replace />;
  }

  // Check role-based access if roles are specified
  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasRole(allowedRoles)) {
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: 'grey.100',
            p: 3
          }}
        >
          <Box sx={{ maxWidth: 600, textAlign: 'center' }}>
            <Alert
              severity="error"
              sx={{
                p: 3,
                borderRadius: 2,
                '& .MuiAlert-message': {
                  width: '100%'
                }
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ReportProblemIcon sx={{ mr: 1, fontSize: 24 }} />
                <strong>Access Denied</strong>
              </Box>

              <Box sx={{ mb: 2 }}>
                You don't have permission to view this page.
              </Box>

              <Box sx={{ mb: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
                <strong>Required roles:</strong> {allowedRoles.join(', ')}
                <br />
                <strong>Your role:</strong> {user?.role || 'None'}
              </Box>

              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  href="/admin/dashboard"
                  sx={{
                    mr: 1,
                    background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                    }
                  }}
                >
                  Return to Dashboard
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => window.history.back()}
                  sx={{ ml: 1 }}
                >
                  Go Back
                </Button>
              </Box>
            </Alert>
          </Box>
        </Box>
      );
    }
  }

  // User is authenticated and has required role (if specified), render protected content
  return <>{children}</>;
};

export default ProtectedRoute;
