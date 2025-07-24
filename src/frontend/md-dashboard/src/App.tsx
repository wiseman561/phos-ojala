import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import PatientQueue from './pages/PatientQueue';
import PatientDetail from './pages/PatientDetail';
import EscalatedAlerts from './pages/EscalatedAlerts';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
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
            <Route path="/login" element={<LoginPage />} />

            {/* Protected Routes - Require Physician Authentication */}
            <Route
              path="/"
              element={
                <PrivateRoute requiredRole="physician">
                  <Navigate to="/patient-queue" replace />
                </PrivateRoute>
              }
            />
            <Route
              path="/patient-queue"
              element={
                <PrivateRoute requiredRole="physician">
                  <PatientQueue />
                </PrivateRoute>
              }
            />
            <Route
              path="/patient/:id"
              element={
                <PrivateRoute requiredRole="physician">
                  <PatientDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/escalated-alerts"
              element={
                <PrivateRoute requiredRole="physician">
                  <EscalatedAlerts />
                </PrivateRoute>
              }
            />

            {/* Catch-all route - redirect to patient queue or login */}
            <Route
              path="*"
              element={
                <PrivateRoute requiredRole="physician">
                  <Navigate to="/patient-queue" replace />
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
