import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/auth/AuthContext';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Container,
  Alert,
  Card,
  CardContent,
  Button
} from '@mui/material';
import {
  Security,
  Block,
  Home,
  LocalHospital
} from '@mui/icons-material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallbackPath = '/login'
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();
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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Container maxWidth="sm">
          <Card elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <CardContent sx={{ textAlign: 'center', p: 6 }}>
              <LocalHospital sx={{ fontSize: 64, color: 'primary.main', mb: 3 }} />
              <Typography variant="h5" fontWeight={600} gutterBottom color="text.primary">
                Verifying Access
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Please wait while we verify your patient credentials...
              </Typography>

              <Box sx={{ mt: 4, mb: 2 }}>
                <CircularProgress size={40} thickness={4} />
              </Box>

              <Typography variant="body2" color="text.secondary">
                Loading your patient dashboard
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

  // Check if user is a patient
  if (user?.role !== 'patient') {
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
                This is a patient-only area
              </Typography>
            </Box>

            <CardContent sx={{ p: 4 }}>
              <Alert
                severity="error"
                sx={{ mb: 3, borderRadius: 2 }}
                icon={<Security />}
              >
                <Typography variant="body1" fontWeight={500}>
                  Patient Access Required
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  You must be logged in as a patient to access this portal.
                </Typography>
              </Alert>

              {/* User Info */}
              <Paper
                variant="outlined"
                sx={{ p: 3, mb: 3, backgroundColor: '#f8f9fa', borderRadius: 2 }}
              >
                <Typography variant="h6" gutterBottom color="text.primary">
                  Current Account
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Role: {user?.role || 'Unknown'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Email: {user?.email || 'Not specified'}
                </Typography>
              </Paper>

              {/* Actions */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button
                  variant="contained"
                  startIcon={<Home />}
                  onClick={() => window.location.href = '/'}
                  sx={{ px: 4 }}
                >
                  Go to Home
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Security />}
                  onClick={() => window.location.href = '/login'}
                  sx={{ px: 4 }}
                >
                  Patient Login
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  // User is authenticated as a patient, render children
  return <>{children}</>;
};

export default ProtectedRoute;
