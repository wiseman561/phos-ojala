import React, { useState } from 'react';
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
  Paper,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import SyncIcon from '@mui/icons-material/Sync';
import SettingsIcon from '@mui/icons-material/Settings';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

/**
 * Integration Status Card Component
 * 
 * Displays the current status of all system integrations
 * with external services and APIs.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.integrations - List of integration objects
 * @param {boolean} props.loading - Loading state
 */
const IntegrationStatusCard = ({ integrations = [], loading = false }) => {
  // State for action menu
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [selectedIntegrationId, setSelectedIntegrationId] = useState(null);

  // Handle action menu open
  const handleActionClick = (event, integrationId) => {
    event.stopPropagation();
    setActionAnchorEl(event.currentTarget);
    setSelectedIntegrationId(integrationId);
  };

  // Handle action menu close
  const handleActionClose = () => {
    setActionAnchorEl(null);
    setSelectedIntegrationId(null);
  };

  // Get status icon based on status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'operational':
        return <CheckCircleIcon fontSize="small" sx={{ color: 'success.main' }} />;
      case 'degraded':
        return <WarningIcon fontSize="small" sx={{ color: 'warning.main' }} />;
      case 'error':
        return <ErrorIcon fontSize="small" sx={{ color: 'error.main' }} />;
      case 'syncing':
        return <SyncIcon fontSize="small" sx={{ color: 'info.main' }} className="rotating-icon" />;
      default:
        return <WarningIcon fontSize="small" sx={{ color: 'text.secondary' }} />;
    }
  };

  // Get status chip based on status
  const getStatusChip = (status) => {
    const statusMap = {
      'operational': { label: 'Operational', color: 'success' },
      'degraded': { label: 'Degraded', color: 'warning' },
      'error': { label: 'Error', color: 'error' },
      'syncing': { label: 'Syncing', color: 'info' },
      'paused': { label: 'Paused', color: 'default' },
      'unknown': { label: 'Unknown', color: 'default' }
    };

    const statusInfo = statusMap[status] || statusMap.unknown;

    return (
      <Chip 
        size="small" 
        label={statusInfo.label} 
        color={statusInfo.color} 
        sx={{ minWidth: 90 }}
      />
    );
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  return (
    <Card>
      <CardHeader 
        title="Integration Status" 
        action={
          <Box sx={{ display: 'flex' }}>
            <Button 
              variant="outlined" 
              size="small" 
              startIcon={<SyncIcon />}
              sx={{ mr: 1 }}
            >
              Sync All
            </Button>
            <Tooltip title="Refresh Status">
              <IconButton size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      <Divider />
      <CardContent sx={{ p: 0 }}>
        {loading ? (
          <Box sx={{ p: 3 }}>
            <LinearProgress />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              Loading integration status...
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ border: 'none' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Integration</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Sync</TableCell>
                  <TableCell>Sync Duration</TableCell>
                  <TableCell>Records</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {integrations.length > 0 ? (
                  integrations.map((integration) => (
                    <TableRow key={integration.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getStatusIcon(integration.status)}
                          <Typography variant="body2" sx={{ ml: 1, fontWeight: 500 }}>
                            {integration.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          size="small" 
                          label={integration.type} 
                          variant="outlined"
                          sx={{ 
                            textTransform: 'capitalize',
                            backgroundColor: 'rgba(0, 0, 0, 0.04)'
                          }}
                        />
                      </TableCell>
                      <TableCell>{getStatusChip(integration.status)}</TableCell>
                      <TableCell>{formatDate(integration.lastSync)}</TableCell>
                      <TableCell>{formatDuration(integration.syncDuration)}</TableCell>
                      <TableCell>{integration.recordCount?.toLocaleString() || 'N/A'}</TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small"
                          onClick={(e) => handleActionClick(e, integration.id)}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box sx={{ py: 3 }}>
                        <Typography variant="body1" color="text.secondary">
                          No integrations configured
                        </Typography>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          sx={{ mt: 1 }}
                        >
                          Add Integration
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>

      {/* Integration Actions Menu */}
      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={handleActionClose}
      >
        <MenuItem onClick={handleActionClose}>
          <ListItemIcon>
            <SyncIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sync Now</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleActionClose}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Configure</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleActionClose}>
          <ListItemIcon>
            <OpenInNewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleActionClose}>
          <ListItemIcon>
            <PauseIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Pause Integration</ListItemText>
        </MenuItem>
      </Menu>

      {/* CSS for rotating sync icon */}
      <style jsx>{`
        .rotating-icon {
          animation: spin 2s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Card>
  );
};

export default IntegrationStatusCard;
