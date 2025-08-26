import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Badge,
  LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  MoreVert as MoreVertIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import theme from '../../theme';

// Helper function to get severity color and icon
const getSeverityInfo = (severity) => {
  switch(severity) {
    case 'critical':
      return {
        color: theme.palette.error.main,
        icon: <WarningIcon />,
        label: 'Critical'
      };
    case 'urgent':
      return {
        color: theme.palette.error.light,
        icon: <WarningIcon />,
        label: 'Urgent'
      };
    case 'warning':
      return {
        color: theme.palette.warning.main,
        icon: <WarningIcon />,
        label: 'Warning'
      };
    case 'info':
    default:
      return {
        color: theme.palette.info.main,
        icon: <InfoIcon />,
        label: 'Info'
      };
  }
};

/**
 * AlertCard Component
 *
 * Displays an alert card for the RN dashboard with severity,
 * patient information, and action buttons.
 *
 * @param {Object} props
 * @param {Object} props.alert - Alert data object
 * @param {Function} props.onAlertClick - Function to call when card is clicked
 * @param {Function} props.onResolveClick - Function to call when resolve button is clicked
 * @param {Function} props.onAssignClick - Function to call when assign button is clicked
 * @param {Function} props.onMoreClick - Function to call when more options button is clicked
 */
const AlertCard = ({
  alert,
  onAlertClick,
  onResolveClick,
  onAssignClick,
  onMoreClick
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Get severity information
  const severityInfo = getSeverityInfo(alert.severity);

  // Format time since alert was generated
  const formatTimeSince = (timestamp) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffMs = now - alertTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return `${diffDays}d ago`;
    }
  };

  // Calculate escalation time remaining if applicable
  const getEscalationTimeRemaining = () => {
    if (!alert.escalation || !alert.escalation.autoEscalateAfter) return null;

    const now = new Date();
    const alertTime = new Date(alert.timestamp);
    const escalateAfterMs = alert.escalation.autoEscalateAfter * 60000; // Convert minutes to ms
    const escalationTime = new Date(alertTime.getTime() + escalateAfterMs);
    const remainingMs = escalationTime - now;

    if (remainingMs <= 0) return 'Escalated';

    const remainingMins = Math.ceil(remainingMs / 60000);
    return `${remainingMins}m`;
  };

  // Calculate escalation progress percentage
  const getEscalationProgress = () => {
    if (!alert.escalation || !alert.escalation.autoEscalateAfter) return 0;

    const now = new Date();
    const alertTime = new Date(alert.timestamp);
    const escalateAfterMs = alert.escalation.autoEscalateAfter * 60000; // Convert minutes to ms
    const elapsedMs = now - alertTime;

    if (elapsedMs >= escalateAfterMs) return 100;

    return (elapsedMs / escalateAfterMs) * 100;
  };

  return (
    <StyledCard
      onClick={onAlertClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      severity={alert.severity}
    >
      <CardContent>
        <Grid container spacing={2}>
          {/* Alert Header */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Box display="flex" alignItems="center">
                <SeverityIcon severity={alert.severity}>
                  {severityInfo.icon}
                </SeverityIcon>

                <Box ml={1}>
                  <Chip
                    label={severityInfo.label}
                    size="small"
                    sx={{
                      backgroundColor: severityInfo.color,
                      color: '#fff',
                      fontWeight: 'bold'
                    }}
                  />

                  <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                    {formatTimeSince(alert.timestamp)}
                  </Typography>
                </Box>
              </Box>

              <Box>
                {alert.actionRequired && (
                  <Chip
                    label="Action Required"
                    size="small"
                    color="error"
                    variant="outlined"
                    sx={{ mr: 1 }}
                  />
                )}

                {alert.status === 'new' && (
                  <Badge
                    color="error"
                    variant="dot"
                    sx={{ mr: 1 }}
                  >
                    <Chip
                      label="New"
                      size="small"
                      color="primary"
                    />
                  </Badge>
                )}

                {alert.status === 'in_progress' && (
                  <Chip
                    label="In Progress"
                    size="small"
                    color="warning"
                    sx={{ mr: 1 }}
                  />
                )}
              </Box>
            </Box>
          </Grid>

          {/* Alert Title and Description */}
          <Grid item xs={12}>
            <Typography variant="h6" component="div">
              {alert.title}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {alert.description}
            </Typography>
          </Grid>

          {/* Patient Information */}
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Patient
              </Typography>

              <Typography variant="body1">
                {alert.patient.firstName} {alert.patient.lastName}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                ID: {alert.patient.patientId} • {alert.patient.age} years, {alert.patient.gender}
              </Typography>

              <Box display="flex" alignItems="center" mt={1}>
                <Chip
                  label={alert.patient.riskLevel}
                  size="small"
                  color={
                    alert.patient.riskLevel === 'High' ? 'error' :
                    alert.patient.riskLevel === 'Moderate' ? 'warning' : 'success'
                  }
                  sx={{ mr: 1 }}
                />

                {alert.patient.conditions.slice(0, 2).map((condition, index) => (
                  <Chip
                    key={index}
                    label={condition}
                    size="small"
                    variant="outlined"
                    sx={{ mr: 1 }}
                  />
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Alert Details */}
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Details
              </Typography>

              <Box display="flex" alignItems="center" mb={1}>
                <Typography variant="body2" sx={{ mr: 1 }}>
                  Vital Type:
                </Typography>
                <Chip
                  label={alert.vitalType || 'N/A'}
                  size="small"
                  variant="outlined"
                />
              </Box>

              {alert.value && (
                <Box display="flex" alignItems="center" mb={1}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Value:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {alert.value} {alert.unit}
                  </Typography>

                  {alert.percentChange && (
                    <Box display="flex" alignItems="center" ml={1}>
                      {alert.percentChange > 0 ? (
                        <ArrowUpwardIcon fontSize="small" color="error" />
                      ) : (
                        <ArrowDownwardIcon fontSize="small" color="success" />
                      )}
                      <Typography
                        variant="body2"
                        color={alert.percentChange > 0 ? 'error' : 'success'}
                      >
                        {Math.abs(alert.percentChange)}%
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}

              {alert.normalRange && (
                <Box display="flex" alignItems="center">
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Normal Range:
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {alert.normalRange.min} - {alert.normalRange.max} {alert.unit}
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>

          {/* Escalation Timer (if applicable) */}
          {alert.escalation && alert.escalation.autoEscalateAfter && (
            <Grid item xs={12}>
              <Box>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                  <Typography variant="caption" color="error">
                    Auto-escalation
                  </Typography>
                  <Typography variant="caption" color="error" fontWeight="bold">
                    {getEscalationTimeRemaining()}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={getEscalationProgress()}
                  sx={{
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: theme.palette.grey[200],
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 2,
                      backgroundColor: theme.palette.error.main
                    }
                  }}
                />
              </Box>
            </Grid>
          )}

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" mt={1}>
              {alert.assignedTo ? (
                <Chip
                  label={`Assigned to: ${alert.assignedTo.name}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ mr: 1 }}
                />
              ) : (
                <Tooltip title="Assign Alert">
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAssignClick(alert.id);
                    }}
                    sx={{ mr: 1 }}
                  >
                    Assign
                  </Button>
                </Tooltip>
              )}

              <Tooltip title="Resolve Alert">
                <Button
                  variant="contained"
                  size="small"
                  color="primary"
                  startIcon={<CheckCircleIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onResolveClick(alert.id);
                  }}
                  sx={{ mr: 1 }}
                >
                  Resolve
                </Button>
              </Tooltip>

              <Tooltip title="More Options">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoreClick(alert.id, e.currentTarget);
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </StyledCard>
  );
};

// Styled Components
const StyledCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'severity'
})(({ theme, severity }) => ({
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
  borderLeft: `4px solid ${getSeverityInfo(severity).color}`,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const SeverityIcon = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'severity'
})(({ theme, severity }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 40,
  borderRadius: '50%',
  backgroundColor: `${getSeverityInfo(severity).color}20`,
  color: getSeverityInfo(severity).color,
}));

const Button = styled('button')(({ theme, variant, color, size }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: size === 'small' ? '4px 10px' : '6px 16px',
  borderRadius: theme.shape.borderRadius,
  fontSize: size === 'small' ? '0.8125rem' : '0.875rem',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'background-color 0.2s, color 0.2s, border-color 0.2s',
  ...(variant === 'contained' && {
    backgroundColor: color === 'primary' ? theme.palette.primary.main : theme.palette.grey[300],
    color: color === 'primary' ? theme.palette.primary.contrastText : theme.palette.text.primary,
    border: 'none',
    '&:hover': {
      backgroundColor: color === 'primary' ? theme.palette.primary.dark : theme.palette.grey[400],
    },
  }),
  ...(variant === 'outlined' && {
    backgroundColor: 'transparent',
    color: color === 'primary' ? theme.palette.primary.main : theme.palette.text.primary,
    border: `1px solid ${color === 'primary' ? theme.palette.primary.main : theme.palette.grey[300]}`,
    '&:hover': {
      backgroundColor: color === 'primary' ? theme.palette.primary.main + '10' : theme.palette.grey[100],
    },
  }),
}));

export default AlertCard;
