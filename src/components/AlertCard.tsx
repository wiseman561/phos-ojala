import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

export interface Alert {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  type: string;
}

export interface AlertCardProps {
  alert: Alert;
}

export default function AlertCard({ alert }: AlertCardProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'high': return '#F44336';
      case 'critical': return '#D32F2F';
      default: return '#757575';
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={1}>
          <Box
            width={12}
            height={12}
            borderRadius="50%"
            bgcolor={getSeverityColor(alert.severity)}
            mr={1}
          />
          <Typography variant="h6" component="h3">
            {alert.type}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {alert.message}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {new Date(alert.timestamp).toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
}
