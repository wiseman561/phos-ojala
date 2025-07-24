import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  AppBar,
  Toolbar,
} from '@mui/material';
import EscalatedAlertsPanel from '../components/EscalatedAlertsPanel';
import signalRClient from '../realtime/signalrClient';
import alertService from '../services/alertService';

console.log('[EscalatedAlerts] EscalatedAlertsPanel import:', EscalatedAlertsPanel);

// Force reload - debug messages should appear after this
console.log('[EscalatedAlerts] Component file loaded successfully');

const EscalatedAlerts: React.FC = () => {
  const navigate = useNavigate();

  // Initialize alert service connection
  useEffect(() => {
    // Initialize alert service connection
    console.log('[EscalatedAlerts] Initializing alert service connection');
    alertService.connect();

    // Initialize legacy SignalR connection if not already connected
    if (!signalRClient.isConnected()) {
      console.log('[EscalatedAlerts] Initializing legacy SignalR connection');
      signalRClient.connect();
    }
  }, []);

  const handleBack = () => {
    navigate('/patient-queue');
  };

  const handleTestSignalR = async () => {
    if (signalRClient.isConnected()) {
      await signalRClient.sendMessage('Dr. Test', 'This is a test message from MD Dashboard');
      console.log('[EscalatedAlerts] Test message sent via SignalR');
    } else {
      console.warn('[EscalatedAlerts] SignalR not connected, cannot send test message');
    }
  };

  const handleTestAlert = () => {
    if (signalRClient.isConnected()) {
      signalRClient.simulateAlert({
        id: `test-alert-${Date.now()}`,
        patientName: 'Test Patient',
        alertType: 'critical',
        message: 'Test alert from MD Dashboard - Blood pressure critical',
        patientId: 999,
        severity: 'high'
      });
      console.log('[EscalatedAlerts] Test alert sent via SignalR');
    } else {
      console.warn('[EscalatedAlerts] SignalR not connected, cannot send test alert');
    }
  };

  console.log('[EscalatedAlerts] About to render EscalatedAlertsPanel component');

  return (
    <>
      {/* Navigation Header */}
      <AppBar position="static" sx={{ mb: 4 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            MD Dashboard
          </Typography>
          <Button color="inherit" onClick={() => navigate('/patient-queue')}>
            Patient Queue
          </Button>
          <Button color="inherit" onClick={() => navigate('/escalated-alerts')}>
            Escalated Alerts
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            onClick={handleBack}
            sx={{ mb: 2 }}
          >
            ← Back to Patient Queue
          </Button>

        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          Escalated Alerts
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Monitor and manage emergency alerts requiring immediate attention
        </Typography>

        {/* SignalR Test Buttons (for development) */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleTestSignalR}
            size="small"
          >
            Test SignalR Connection
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleTestAlert}
            size="small"
          >
            Test SignalR Alert
          </Button>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            (Development only - sends test messages/alerts)
          </Typography>
        </Box>
      </Box>

      {/* Escalated Alerts Panel */}
      <Paper
        elevation={1}
        sx={{
          overflow: 'hidden',
          '& .w-full': { width: '100%' },
          '& .flex': { display: 'flex' },
          '& .items-center': { alignItems: 'center' },
          '& .justify-between': { justifyContent: 'space-between' },
          '& .p-3': { padding: '12px' },
          '& .mr-2': { marginRight: '8px' },
          '& .mb-2': { marginBottom: '8px' },
          '& .mb-4': { marginBottom: '16px' },
          '& .ml-2': { marginLeft: '8px' },
          '& .ml-3': { marginLeft: '12px' },
          '& .mt-1': { marginTop: '4px' },
          '& .cursor-pointer': { cursor: 'pointer' },
          '& .font-semibold': { fontWeight: '600' },
          '& .font-medium': { fontWeight: '500' },
          '& .text-red-600': { color: '#dc2626' },
          '& .text-yellow-600': { color: '#d97706' },
          '& .text-blue-600': { color: '#2563eb' },
          '& .text-gray-600': { color: '#4b5563' },
          '& .text-gray-700': { color: '#374151' },
          '& .text-gray-800': { color: '#1f2937' },
          '& .text-gray-500': { color: '#6b7280' },
          '& .text-green-600': { color: '#16a34a' },
          '& .bg-red-100': { backgroundColor: '#fee2e2' },
          '& .bg-red-50': { backgroundColor: '#fef2f2' },
          '& .bg-gray-100': { backgroundColor: '#f3f4f6' },
          '& .bg-gray-50': { backgroundColor: '#f9fafb' },
          '& .bg-white': { backgroundColor: '#ffffff' },
          '& .border-l-4': { borderLeftWidth: '4px' },
          '& .border-red-600': { borderLeftColor: '#dc2626' },
          '& .border-red-500': { borderLeftColor: '#ef4444' },
          '& .border-gray-400': { borderLeftColor: '#9ca3af' },
          '& .border-gray-300': { borderLeftColor: '#d1d5db', borderColor: '#d1d5db' },
          '& .border': { borderWidth: '1px' },
          '& .rounded': { borderRadius: '4px' },
          '& .rounded-r': { borderTopRightRadius: '4px', borderBottomRightRadius: '4px' },
          '& .shadow-md': { boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' },
          '& .space-y-3 > * + *': { marginTop: '12px' },
          '& .text-center': { textAlign: 'center' },
          '& .py-4': { paddingTop: '16px', paddingBottom: '16px' },
          '& .px-3': { paddingLeft: '12px', paddingRight: '12px' },
          '& .py-1': { paddingTop: '4px', paddingBottom: '4px' },
          '& .text-sm': { fontSize: '0.875rem', lineHeight: '1.25rem' },
          '& .text-xs': { fontSize: '0.75rem', lineHeight: '1rem' },
          '& .text-lg': { fontSize: '1.125rem', lineHeight: '1.75rem' },
          '& .opacity-75': { opacity: '0.75' },
          '& .bg-blue-500': { backgroundColor: '#3b82f6' },
          '& .hover\\:bg-blue-600:hover': { backgroundColor: '#2563eb' },
          '& .text-white': { color: '#ffffff' },
          '& .form-checkbox': {
            appearance: 'none',
            backgroundColor: '#fff',
            borderColor: '#d1d5db',
            borderWidth: '1px',
            borderRadius: '0.25rem',
            '&:checked': {
              backgroundColor: '#2563eb',
              borderColor: '#2563eb',
            }
          },
          '& .h-5': { height: '1.25rem' },
          '& .w-5': { width: '1.25rem' },
          '& .inline-flex': { display: 'inline-flex' },
        }}
      >
        <EscalatedAlertsPanel />
      </Paper>
    </Container>
    </>
  );
};

export default EscalatedAlerts;
