import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  LocalHospital as HospitalIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

export interface AlertData {
  id: string;
  patientName: string;
  alertType: 'critical' | 'warning' | 'info' | 'emergency';
  message: string;
  timestamp: string;
  patientId?: number;
  severity?: 'high' | 'medium' | 'low';
}

interface AlertCardProps {
  alert: AlertData;
  onClick?: (alert: AlertData) => void;
  className?: string;
}

const AlertCard: React.FC<AlertCardProps> = ({ alert, onClick, className }) => {
  const getSeverityInfo = (alertType: string) => {
    switch (alertType) {
      case 'critical':
      case 'emergency':
        return {
          color: 'error' as const,
          icon: <ErrorIcon />,
          bgColor: '#ffebee',
          borderColor: '#f44336',
        };
      case 'warning':
        return {
          color: 'warning' as const,
          icon: <WarningIcon />,
          bgColor: '#fff8e1',
          borderColor: '#ff9800',
        };
      case 'info':
      default:
        return {
          color: 'info' as const,
          icon: <InfoIcon />,
          bgColor: '#e3f2fd',
          borderColor: '#2196f3',
        };
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  const severityInfo = getSeverityInfo(alert.alertType);

  return (
    <Card
      className={className}
      onClick={() => onClick?.(alert)}
      sx={{
        mb: 2,
        cursor: onClick ? 'pointer' : 'default',
        borderLeft: `4px solid ${severityInfo.borderColor}`,
        backgroundColor: severityInfo.bgColor,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: onClick ? 'translateY(-2px)' : 'none',
          boxShadow: onClick ? 4 : 1,
        },
      }}
    >
      <CardContent sx={{ pb: '16px !important' }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Alert Icon */}
          <Avatar
            sx={{
              bgcolor: severityInfo.borderColor,
              width: 40,
              height: 40,
            }}
          >
            {severityInfo.icon}
          </Avatar>

          {/* Alert Content */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 1 }}>
              <Chip
                label={alert.alertType.toUpperCase()}
                color={severityInfo.color}
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
              <Typography variant="caption" color="text.secondary">
                {formatTime(alert.timestamp)}
              </Typography>
            </Box>

            {/* Patient Name */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <HospitalIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {alert.patientName}
              </Typography>
              {alert.patientId && (
                <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                  (ID: {alert.patientId})
                </Typography>
              )}
            </Box>

            {/* Alert Message */}
            <Typography
              variant="body2"
              sx={{
                color: 'text.primary',
                lineHeight: 1.4,
                wordBreak: 'break-word',
              }}
            >
              {alert.message}
            </Typography>

            {/* Additional Info */}
            {alert.severity && (
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={`Severity: ${alert.severity}`}
                  variant="outlined"
                  size="small"
                  sx={{ fontSize: '0.75rem' }}
                />
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AlertCard;
