import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import theme from '../theme';

/**
 * AlertHistoryCard Component (Web Stub)
 *
 * Minimal web-compatible version of the AlertHistoryCard component
 */
const AlertHistoryCard = ({ alerts = [], onAlertPress, onViewAllPress }) => {
  return (
    <Card sx={{ m: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Alert History
          </Typography>
          <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }} onClick={onViewAllPress}>
            View All
          </Typography>
        </Box>
        <Typography variant="body2">
          {alerts.length} alerts in history
        </Typography>
      </CardContent>
    </Card>
  );
};

export default AlertHistoryCard;
