import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, NURSE_ROLES, NurseRole } from '../contexts/AuthContext';
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Paper,
  Alert,
  AlertTitle
} from '@mui/material';
import { LocalHospital, Security } from '@mui/icons-material';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: NurseRole[];
  requireNurseRole?: boolean;
}

/**
 * PrivateRoute Component for RN Dashboard
 * 
 * Protects routes by ensuring:
 * 1. User is authenticated
 * 2. User has nurse role (RN, LPN, etc.)
 * 3. User has specific required roles if specified
 * 
 * @param children - The protected content to render
 * @param allowedRoles - Specific nurse roles allowed (optional)
 * @param requireNurseRole - Whether to enforce nurse role validation (default: true)
 */
const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  children, 
  allowedRoles,
  requireNurseRole = true 
}) => {
  const { isAuthenticated, user, isLoading, hasRole } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        bgcolor="#f5f5f5"
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
            backgroundColor: '#ffffff'
          }}
        >
          <LocalHospital 
            sx={{ 
              fontSize: 48, 
              color: 'primary.main', 
              mb: 2 
            }} 
          />
          <CircularProgress 
            size={40} 
            sx={{ 
              color: 'primary.main',
              mb: 2 
            }} 
          />
          <Typography variant="h6" color="text.secondary">
            Verifying Nurse Credentials...
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Please wait while we authenticate your access
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check if user has nurse role
  if (requireNurseRole) {
    const isNurse = hasRole(Object.values(NURSE_ROLES)) || hasRole(['PROVIDER']);
    
    if (!isNurse) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          bgcolor="#f5f5f5"
          p={3}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 2,
              backgroundColor: '#ffffff',
              maxWidth: 500
            }}
          >
            <Security 
              sx={{ 
                fontSize: 64, 
                color: 'error.main', 
                mb: 2 
              }} 
            />
            
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Access Denied</AlertTitle>
              Nurse credentials required to access this area.
            </Alert>

            <Typography variant="h5" gutterBottom color="text.primary">
              Access Restricted
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              This area is restricted to licensed nursing staff only.
            </Typography>
            
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Current Role:</strong> {user.role || 'Unknown'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>Required Roles:</strong> RN, LPN, Nurse Manager, Charge Nurse, Staff Nurse, Provider
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Please contact your administrator if you believe this is an error.
            </Typography>
          </Paper>
        </Box>
      );
    }
  }

  // Check specific role requirements
  if (allowedRoles && allowedRoles.length > 0) {
    if (!hasRole(allowedRoles)) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="100vh"
          bgcolor="#f5f5f5"
          p={3}
        >
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 2,
              backgroundColor: '#ffffff',
              maxWidth: 500
            }}
          >
            <Security 
              sx={{ 
                fontSize: 64, 
                color: 'warning.main', 
                mb: 2 
              }} 
            />
            
            <Alert severity="warning" sx={{ mb: 2 }}>
              <AlertTitle>Insufficient Permissions</AlertTitle>
              Additional permissions required for this section.
            </Alert>

            <Typography variant="h5" gutterBottom color="text.primary">
              Permission Required
            </Typography>
            
            <Typography variant="body1" color="text.secondary" paragraph>
              You don't have the necessary permissions to view this section.
            </Typography>
            
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Your Role:</strong> {user.role}
              </Typography>
              {user.roles && user.roles.length > 1 && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <strong>All Roles:</strong> {user.roles.join(', ')}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                <strong>Required Roles:</strong> {allowedRoles.join(', ')}
              </Typography>
            </Box>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Please contact your nurse manager for access to this area.
            </Typography>
          </Paper>
        </Box>
      );
    }
  }

  // User is authenticated and has required roles - render protected content
  return <>{children}</>;
};

export default PrivateRoute; 