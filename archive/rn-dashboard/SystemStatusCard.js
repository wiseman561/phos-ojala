import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Divider, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Box,
  Typography,
  IconButton,
  Tooltip,
  LinearProgress,
  Paper
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import HelpIcon from '@mui/icons-material/Help';

/**
 * System Status Card Component
 * 
 * Displays the current status of all system components and services
 * with visual indicators for health status.
 * 
 * @param {Object} props - Component props
 * @param {Object} props.status - System status data
 * @param {boolean} props.loading - Loading state
 */
const SystemStatusCard = ({ status, loading }) => {
  // Get status icon and color based on status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return <CheckCircleIcon fontSize="small" sx={{ color: 'success.main' }} />;
      case 'degraded':
        return <WarningIcon fontSize="small" sx={{ color: 'warning.main' }} />;
      case 'outage':
        return <ErrorIcon fontSize="small" sx={{ color: 'error.main' }} />;
      default:
        return <HelpIcon fontSize="small" sx={{ color: 'info.main' }} />;
    }
  };

  // Get status chip based on status
  const getStatusChip = (status) => {
    const statusMap = {
      'operational': { label: 'Operational', color: 'success' },
      'degraded': { label: 'Degraded', color: 'warning' },
      'outage': { label: 'Outage', color: 'error' },
      'maintenance': { label: 'Maintenance', color: 'info' },
      'unknown': { label: 'Unknown', color: 'default' }
    };

    const statusInfo = statusMap[status] || statusMap.unknown;

    return (
      <Chip 
        size="small" 
        label={statusInfo.label} 
        color={statusInfo.color} 
        sx={{ minWidth: 100 }}
      />
    );
  };

  // Calculate overall system health
  const calculateOverallHealth = () => {
    if (!status || !status.services || status.services.length === 0) {
      return 'unknown';
    }

    const statusCounts = {
      operational: 0,
      degraded: 0,
      outage: 0,
      maintenance: 0,
      unknown: 0
    };

    status.services.forEach(service => {
      statusCounts[service.status] = (statusCounts[service.status] || 0) + 1;
    });

    if (statusCounts.outage > 0) {
      return 'outage';
    } else if (statusCounts.degraded > 0) {
      return 'degraded';
    } else if (statusCounts.maintenance > 0 && statusCounts.operational === 0) {
      return 'maintenance';
    } else if (statusCounts.operational > 0) {
      return 'operational';
    } else {
      return 'unknown';
    }
  };

  // Get last updated time
  const getLastUpdated = () => {
    if (!status || !status.lastUpdated) {
      return 'Unknown';
    }

    const lastUpdated = new Date(status.lastUpdated);
    return lastUpdated.toLocaleString();
  };

  return (
    <Card>
      <CardHeader 
        title="System Status" 
        action={
          <Tooltip title="Refresh Status">
            <IconButton size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <Divider />
      <CardContent>
        {loading ? (
          <LinearProgress sx={{ mb: 2 }} />
        ) : (
          <>
            {/* Overall System Health */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{ mr: 2 }}>
                {getStatusIcon(calculateOverallHealth())}
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Overall System Health
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="h6">
                    {calculateOverallHealth() === 'operational' ? 'All Systems Operational' : 
                     calculateOverallHealth() === 'degraded' ? 'Some Systems Degraded' :
                     calculateOverallHealth() === 'outage' ? 'System Outage Detected' :
                     calculateOverallHealth() === 'maintenance' ? 'Scheduled Maintenance' : 'Status Unknown'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Last updated: {getLastUpdated()}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Services Table */}
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Service</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Uptime</TableCell>
                    <TableCell>Last Incident</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {status && status.services ? (
                    status.services.map((service) => (
                      <TableRow key={service.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {getStatusIcon(service.status)}
                            <Typography variant="body2" sx={{ ml: 1 }}>
                              {service.name}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{getStatusChip(service.status)}</TableCell>
                        <TableCell>{service.uptime || 'N/A'}</TableCell>
                        <TableCell>{service.lastIncident || 'None'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        No service data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SystemStatusCard;
