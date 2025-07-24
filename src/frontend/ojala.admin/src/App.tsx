import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { Toaster } from 'react-hot-toast';

// Layout components
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

// Auth components
import { AuthProvider, ROLES } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Patients from './pages/Patients';
import Alerts from './pages/Alerts';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import Unauthorized from './pages/Unauthorized';
import Login from './pages/Login';
import MaintenanceMode from './components/MaintenanceMode';

// Create Material-UI theme for consistency
const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      light: '#8fa5f0',
      dark: '#4f5bb8',
    },
    secondary: {
      main: '#764ba2',
      light: '#a673d1',
      dark: '#5a3975',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 'bold',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        },
      },
    },
  },
});

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const savedMode = localStorage.getItem('darkMode');
    return savedMode ? JSON.parse(savedMode) : false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 5000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: '#4caf50',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: '#f44336',
              },
            },
          }}
        />
        
        <Router>
          <div className="h-screen flex overflow-hidden bg-gray-100 dark:bg-gray-900">
            <Routes>
              {/* Public routes */}
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/login" element={<Login />} />
              <Route path="/maintenance" element={<MaintenanceMode />} />

              {/* Protected routes with layout */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.PROVIDER, ROLES.NURSE, ROLES.STAFF]}>
                    <div className="flex h-screen">
                      <Sidebar />
                      <div className="flex-1 overflow-auto focus:outline-none">
                        <main className="flex-1 relative z-0 overflow-y-auto py-6">
                          <Routes>
                            {/* Dashboard - Available to all admin users */}
                            <Route 
                              path="/admin/dashboard" 
                              element={<Dashboard />} 
                            />

                            {/* Users management - Admin only */}
                            <Route
                              path="/admin/users"
                              element={
                                <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                                  <Users />
                                </ProtectedRoute>
                              }
                            />

                            {/* Patients management - Admin, Provider, Nurse */}
                            <Route
                              path="/admin/patients"
                              element={
                                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.PROVIDER, ROLES.NURSE]}>
                                  <Patients />
                                </ProtectedRoute>
                              }
                            />

                            {/* Alerts - Admin, Provider, Nurse */}
                            <Route
                              path="/admin/alerts"
                              element={
                                <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.PROVIDER, ROLES.NURSE]}>
                                  <Alerts />
                                </ProtectedRoute>
                              }
                            />

                            {/* System logs - Admin only */}
                            <Route
                              path="/admin/logs"
                              element={
                                <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                                  <Logs />
                                </ProtectedRoute>
                              }
                            />

                            {/* Settings - Admin only */}
                            <Route
                              path="/admin/settings"
                              element={
                                <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                                  <Settings />
                                </ProtectedRoute>
                              }
                            />

                            {/* Default redirect to dashboard */}
                            <Route 
                              path="/" 
                              element={<Navigate to="/admin/dashboard" replace />} 
                            />
                            
                            {/* Catch-all route for unknown admin paths */}
                            <Route 
                              path="/admin/*" 
                              element={<Navigate to="/admin/dashboard" replace />} 
                            />
                          </Routes>
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App; 