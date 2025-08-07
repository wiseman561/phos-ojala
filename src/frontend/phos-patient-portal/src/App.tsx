import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container, Typography, Paper } from '@mui/material';
import { LocalHospital, Dashboard, AccountCircle } from '@mui/icons-material';

import { useAuth } from './contexts/auth/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TelemetryPage from './pages/TelemetryPage';
import TelehealthPage from './pages/TelehealthPage';
import OmicsInsightsPage from './pages/OmicsInsightsPage';
import MessagesPage from './pages/MessagesPage';
import CarePlansPage from './pages/CarePlansPage';
import ProfilePage from './pages/ProfilePage';

const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

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
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <LocalHospital sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6">Loading Patient Portal...</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />

      <Route
        path="/register"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
        }
      />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/telemetry"
        element={
          <ProtectedRoute>
            <TelemetryPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/telehealth"
        element={
          <ProtectedRoute>
            <TelehealthPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/omics-insights"
        element={
          <ProtectedRoute>
            <OmicsInsightsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/care-plans"
        element={
          <ProtectedRoute>
            <CarePlansPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <PlaceholderPage title="Settings" icon={<Dashboard />} />
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route
        path="/"
        element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Placeholder component for unimplemented pages
const PlaceholderPage: React.FC<{
  title: string;
  icon: React.ReactNode;
}> = ({ title, icon }) => (
  <Container maxWidth="md" sx={{ py: 4 }}>
    <Paper elevation={2} sx={{ p: 6, textAlign: 'center' }}>
      <Box sx={{ fontSize: 72, color: 'primary.main', mb: 2 }}>
        {icon}
      </Box>
      <Typography variant="h4" gutterBottom>
        {title}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        This feature is coming soon. The Patient Portal is currently in development.
      </Typography>
    </Paper>
  </Container>
);

export default App;
