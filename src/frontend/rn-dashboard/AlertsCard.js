import React, { useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Menu,
  MenuItem,
  LinearProgress
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FilterListIcon from '@mui/icons-material/FilterList';
import NotificationsIcon from '@mui/icons-material/Notifications';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import PersonIcon from '@mui/icons-material/Person';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';
import SecurityIcon from '@mui/icons-material/Security';

/**
 * Alerts Card Component
 * 
 * Displays active system alerts and notifications with severity levels,
 * filtering options, and action buttons.
 * 
 * @param {Object} props - Component props
 * @param {Array} props.alerts - List of alert objects
 * @param {boolean} props.loading - Loading state
 */
const AlertsCard = ({ alerts = [], loading = false }) => {
  // State for filter menu
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [activeFilters, setActiveFilters] = useState([]);
  
  // State for action menu
  const [actionAnchorEl, setActionAnchorEl] = useState(null);
  const [selectedAlertId, setSelectedAlertId] = useState(null);

  // Handle filter menu open
  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  // Handle filter menu close
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  // Handle filter selection
  const handleFilterSelect = (filter) => {
    if (activeFilters.includes(filter)) {
      setActiveFilters(activeFilters.filter(f => f !== filter));
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  // Handle action menu open
  const handleActionClick = (event, alertId) => {
    event.stopPropagation();
    setActionAnchorEl(event.currentTarget);
    setSelectedAlertId(alertId);
  };

  // Handle action menu close
  const handleActionClose = () => {
    setActionAnchorEl(null);
    setSelectedAlertId(null);
  };

  // Get filtered alerts
  const getFilteredAlerts = () => {
    if (activeFilters.length === 0) {
      return alerts;
    }
    
    return alerts.filter(alert => activeFilters.includes(alert.severity));
  };

  // Get icon based on alert type
  const getAlertIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon sx={{ color: 'error.main' }} />;
      case 'warning':
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      case 'info':
        return <InfoIcon sx={{ color: 'info.main' }} />;
      default:
        return <NotificationsIcon sx={{ color: 'primary.main' }} />;
    }
  };

  // Get avatar based on alert category
  const getAlertAvatar = (category) => {
    const categoryMap = {
      'user': { icon: <PersonIcon />, color: 'primary.main' },
      'health': { icon: <HealthAndSafetyIcon />, color: 'success.main' },
      'system': { icon: <SystemUpdateIcon />, color: 'info.main' },
      'security': { icon: <SecurityIcon />, color: 'error.main' }
    };

    const categoryInfo = categoryMap[category] || categoryMap.system;

    return (
      <Avatar sx={{ bgcolor: categoryInfo.color }}>
        {categoryInfo.icon}
      </Avatar>
    );
  };

  // Get chip based on alert severity
  const getSeverityChip = (severity) => {
    const severityMap = {
      'critical': { label: 'Critical', color: 'error' },
      'warning': { label: 'Warning', color: 'warning' },
      'info': { label: 'Info', color: 'info' }
    };

    const severityInfo = severityMap[severity] || { label: 'Unknown', color: 'default' };

    return (
      <Chip 
        size="small" 
        label={severityInfo.label} 
        color={severityInfo.color}
      />
    );
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <Card>
      <CardHeader 
        title="Active Alerts" 
        action={
          <Box>
            <Tooltip title="Filter Alerts">
              <IconButton 
                size="small" 
                onClick={handleFilterClick}
                color={activeFilters.length > 0 ? 'primary' : 'default'}
              >
                <FilterListIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={filterAnchorEl}
              open={Boolean(filterAnchorEl)}
              onClose={handleFilterClose}
            >
              <MenuItem 
                onClick={() => handleFilterSelect('critical')}
                sx={{ 
                  color: 'error.main',
                  fontWeight: activeFilters.includes('critical') ? 'bold' : 'normal'
                }}
              >
                <ListItemIcon>
                  <ErrorIcon fontSize="small" color="error" />
                </ListItemIcon>
                Critical
              </MenuItem>
              <MenuItem 
                onClick={() => handleFilterSelect('warning')}
                sx={{ 
                  color: 'warning.main',
                  fontWeight: activeFilters.includes('warning') ? 'bold' : 'normal'
                }}
              >
                <ListItemIcon>
                  <WarningIcon fontSize="small" color="warning" />
                </ListItemIcon>
                Warning
              </MenuItem>
              <MenuItem 
                onClick={() => handleFilterSelect('info')}
                sx={{ 
                  color: 'info.main',
                  fontWeight: activeFilters.includes('info') ? 'bold' : 'normal'
                }}
              >
                <ListItemIcon>
                  <InfoIcon fontSize="small" color="info" />
                </ListItemIcon>
                Info
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => setActiveFilters([])}>
                Clear Filters
              </MenuItem>
            </Menu>
          </Box>
        }
      />
      <Divider />
      <CardContent sx={{ p: 0 }}>
        {loading ? (
          <LinearProgress />
        ) : (
          <>
            {getFilteredAlerts().length > 0 ? (
              <List disablePadding>
                {getFilteredAlerts().map((alert) => (
                  <React.Fragment key={alert.id}>
                    <ListItem 
                      alignItems="flex-start"
                      secondaryAction={
                        <IconButton 
                          edge="end" 
                          size="small"
                          onClick={(e) => handleActionClick(e, alert.id)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      }
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'action.hover' 
                        },
                        cursor: 'pointer'
                      }}
                    >
                      <ListItemAvatar>
                        {getAlertAvatar(alert.category)}
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            {getAlertIcon(alert.severity)}
                            <Typography variant="subtitle2">
                              {alert.title}
                            </Typography>
                            <Box sx={{ ml: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
                              {getSeverityChip(alert.severity)}
                            </Box>
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                              {alert.message}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="caption" color="text.secondary">
                                {alert.source}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(alert.timestamp)}
                              </Typography>
                            </Box>
                          </>
                        }
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
                <Typography variant="body1" color="text.secondary">
                  No active alerts
                </Typography>
                {activeFilters.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    Try removing filters to see more alerts
                  </Typography>
                )}
              </Box>
            )}
          </>
        )}
      </CardContent>
      
      {/* Alert Actions Menu */}
      <Menu
        anchorEl={actionAnchorEl}
        open={Boolean(actionAnchorEl)}
        onClose={handleActionClose}
      >
        <MenuItem onClick={handleActionClose}>View Details</MenuItem>
        <MenuItem onClick={handleActionClose}>Mark as Resolved</MenuItem>
        <MenuItem onClick={handleActionClose}>Assign to Team</MenuItem>
        <Divider />
        <MenuItem onClick={handleActionClose} sx={{ color: 'error.main' }}>Dismiss</MenuItem>
      </Menu>
    </Card>
  );
};

export default AlertsCard;
