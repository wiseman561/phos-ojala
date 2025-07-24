import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from './contexts/auth/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './components/LoginPage';
import RNDashboard from './RNDashboard';
import { NURSE_ROLES } from './contexts/auth/AuthContext';

// Create a theme for the RN Dashboard with healthcare-focused colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2', // Medical blue
      light: '#42a5f5',
      dark: '#1565c0',
    },
    secondary: {
      main: '#2e7d32', // Healthcare green
      light: '#66bb6a',
      dark: '#1b5e20',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          borderRadius: 8,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LoginPage />} />

            {/* Protected Routes for Nurses */}
            <Route
              path="/rn"
              element={
                <PrivateRoute
                  allowedRoles={[
                    NURSE_ROLES.RN,
                    NURSE_ROLES.LPN,
                    NURSE_ROLES.NURSE_MANAGER,
                    NURSE_ROLES.CHARGE_NURSE,
                    NURSE_ROLES.STAFF_NURSE,
                    NURSE_ROLES.PROVIDER
                  ]}
                >
                  <RNDashboard />
                </PrivateRoute>
              }
            />

            {/* Legacy route redirects - redirect other roles to their proper dashboards */}
            <Route
              path="/md"
              element={
                <Navigate to="/md-dashboard" replace />
              }
            />
            <Route
              path="/employer"
              element={
                <Navigate to="/employer-dashboard" replace />
              }
            />

            {/* Catch-all route - redirect to login */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
