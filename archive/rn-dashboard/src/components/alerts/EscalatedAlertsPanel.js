import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useEscalatedAlerts } from '../../hooks/useEscalatedAlerts';

/**
 * EscalatedAlertsPanel Component
 *
 * Displays and manages escalated alerts for MD review
 */
const EscalatedAlertsPanel = () => {
  const { alerts, loading, approveAlert, dismissAlert } = useEscalatedAlerts();

  const getSeverityIcon = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return <ErrorIcon color="error" />;
      case 'high':
        return <WarningIcon color="warning" />;
      case 'medium':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon color="action" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTime = (timestamp) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  const pendingAlerts = alerts.filter(alert => alert.status === 'pending');
  const resolvedAlerts = alerts.filter(alert => alert.status !== 'pending');

  return (
    <Box>
      {/* Pending Alerts */}
      {pendingAlerts.length > 0 ? (
        <Box mb={4}>
          <Typography variant="subtitle1" color="primary" gutterBottom>
            Pending Review ({pendingAlerts.length})
          </Typography>
          <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
            {pendingAlerts.map(alert => (
              <Paper
                key={alert.id}
                elevation={1}
                sx={{
                  p: 2,
                  mb: 2,
                  borderLeft: '4px solid',
                  borderColor: alert.severity === 'critical' ? 'error.main' : 'warning.main'
                }}
              >
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Box display="flex" alignItems="center" mb={1}>
                      {getSeverityIcon(alert.severity)}
                      <Typography
                        variant="subtitle2"
                        sx={{ ml: 1, color: alert.severity === 'critical' ? 'error.main' : 'warning.main' }}
                      >
                        {alert.severity.toUpperCase()}
                      </Typography>
                      <Chip
                        size="small"
                        label={formatTime(alert.timestamp)}
                        sx={{ ml: 1 }}
                      />
                    </Box>
                    <Typography variant="body1" gutterBottom>
                      {alert.message}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Patient: {alert.patientName} (ID: {alert.patientId})
                    </Typography>
                    {alert.metric && (
                      <Typography variant="body2" color="textSecondary">
                        {alert.metric}: {alert.value}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <Tooltip title="Approve">
                      <IconButton
                        color="success"
                        onClick={() => approveAlert(alert.id)}
                        sx={{ mr: 1 }}
                      >
                        <CheckCircleIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Dismiss">
                      <IconButton
                        color="error"
                        onClick={() => dismissAlert(alert.id)}
                      >
                        <CancelIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Box>
        </Box>
      ) : (
        <Box textAlign="center" py={3}>
          <Typography color="textSecondary">
            No pending alerts to review
          </Typography>
        </Box>
      )}

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box>
            <Typography variant="subtitle1" color="textSecondary" gutterBottom>
              Recently Resolved ({resolvedAlerts.length})
            </Typography>
            <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
              {resolvedAlerts.slice(0, 5).map(alert => (
                <Paper
                  key={alert.id}
                  elevation={0}
                  sx={{
                    p: 1.5,
                    mb: 1,
                    bgcolor: 'background.default',
                    borderLeft: '4px solid',
                    borderColor: alert.status === 'approved' ? 'success.main' : 'error.main'
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" noWrap>
                        {alert.message}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {formatTime(alert.timestamp)} • {alert.status}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={alert.status}
                      color={alert.status === 'approved' ? 'success' : 'error'}
                    />
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default EscalatedAlertsPanel;
