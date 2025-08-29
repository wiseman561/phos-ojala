import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import theme from '../theme';

/**
 * MedicationRemindersCard Component (Web Stub)
 *
 * Minimal web-compatible version of the MedicationRemindersCard component
 */
const MedicationRemindersCard = ({ medications = [], onMedicationPress, onMedicationToggle, onViewAllPress }) => {
  return (
    <Card sx={{ m: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">
            Medication Reminders
          </Typography>
          <Typography variant="body2" color="primary" sx={{ cursor: 'pointer' }} onClick={onViewAllPress}>
            View All
          </Typography>
        </Box>
        <Typography variant="body2">
          {medications.length} medication reminders scheduled
        </Typography>
      </CardContent>
    </Card>
  );
};

export default MedicationRemindersCard;
