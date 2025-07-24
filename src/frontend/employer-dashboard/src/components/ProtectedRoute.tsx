import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Container,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Security,
  Block,
  Home,
  ContactSupport,
  Warning,
  Business,
  CheckCircle
} from '@mui/icons-material';

export type AllowedRole = 
  | 'EMPLOYER'
  | 'HR_MANAGER'
  | 'BENEFITS_ADMIN'
  | 'EXECUTIVE'
  | 'ORGANIZATION_ADMIN'
  | 'COMPLIANCE_OFFICER';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AllowedRole[];
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles = ['EMPLOYER'],
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, user, isLoading, hasRole } = useAuth();
  const location = useLocation();

  // Show loading spinner while authentication is being verified
  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        }}
      >
        <Container maxWidth="sm">
          <Card elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <CardContent sx={{ textAlign: 'center', p: 6 }}>
              <Security sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
              <Typography variant="h5" fontWeight={600} gutterBottom color="text.primary">
                Verifying Access
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Please wait while we verify your authentication credentials...
              </Typography>
              
              <Box sx={{ mt: 4, mb: 2 }}>
                <CircularProgress size={40} thickness={4} />
              </Box>
              
              <Typography variant="body2" color="text.secondary">
                Checking permissions and loading your dashboard
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // Check if user has any of the required roles
  const hasRequiredRole = allowedRoles.some(role => hasRole(role));

  // Show access denied page if user doesn't have required role
  if (!hasRequiredRole) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%)',
          p: 2
        }}
      >
        <Container maxWidth="md">
          <Card elevation={6} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            {/* Header */}
            <Box
              sx={{
                background: 'linear-gradient(45deg, #d32f2f, #f44336)',
                color: 'white',
                p: 3,
                textAlign: 'center'
              }}
            >
              <Block sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="h4" fontWeight="bold">
                Access Restricted
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, mt: 1 }}>
                You don't have permission to access this resource
              </Typography>
            </Box>

            <CardContent sx={{ p: 4 }}>
              <Alert 
                severity="warning" 
                sx={{ mb: 3, borderRadius: 2 }}
                icon={<Warning />}
              >
                <Typography variant="body1" fontWeight={500}>
                  Insufficient Access Rights
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Your current role does not have permission to access this section of the employer portal.
                </Typography>
              </Alert>

              {/* User Info */}
              <Paper 
                variant="outlined" 
                sx={{ p: 3, mb: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}
              >
                <Typography variant="h6" gutterBottom color="text.primary">
                  Your Account Information
                </Typography>
                <List dense>
                  <ListItem disablePadding>
                    <ListItemIcon>
                      <Business color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Organization" 
                      secondary={user?.organizationName || 'Not specified'}
                    />
                  </ListItem>
                  <ListItem disablePadding>
                    <ListItemIcon>
                      <Security color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Current Role" 
                      secondary={user?.roles?.join(', ') || 'No roles assigned'}
                    />
                  </ListItem>
                </List>
              </Paper>

              {/* Required Roles */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom color="text.primary">
                  Required Access Levels
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  To access this resource, you need one of the following roles:
                </Typography>
                <List dense>
                  {allowedRoles.map((role, index) => (
                    <ListItem key={index} disablePadding>
                      <ListItemIcon>
                        <CheckCircle 
                          color={hasRole(role) ? "success" : "disabled"} 
                          sx={{ fontSize: 20 }}
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={role.replace(/_/g, ' ')}
                        secondary={hasRole(role) ? "You have this role" : "Not assigned"}
                        sx={{
                          '& .MuiListItemText-primary': {
                            fontWeight: hasRole(role) ? 600 : 400,
                            color: hasRole(role) ? 'success.main' : 'text.secondary'
                          }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<Home />}
                  onClick={() => window.location.href = '/dashboard'}
                  sx={{
                    background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                    }
                  }}
                >
                  Go to Dashboard
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<ContactSupport />}
                  onClick={() => {
                    window.open('mailto:support@ojala-healthcare.com?subject=Access Request&body=I need access to additional features in the employer portal.', '_blank');
                  }}
                  sx={{ borderRadius: 2 }}
                >
                  Request Access
                </Button>
              </Box>

              {/* Help Text */}
              <Box sx={{ mt: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" paragraph>
                  If you believe you should have access to this resource, please contact your organization administrator 
                  or IT department to request the appropriate permissions.
                </Typography>
                
                <Typography variant="caption" color="text.secondary">
                  For immediate assistance, contact Ojala Healthcare support at{' '}
                  <a href="mailto:support@ojala-healthcare.com" style={{ color: '#1976d2' }}>
                    support@ojala-healthcare.com
                  </a>
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  // User is authenticated and has required role - render the protected component
  return <>{children}</>;
};

export default ProtectedRoute; 