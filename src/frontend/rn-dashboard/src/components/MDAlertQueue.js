import React from 'react';
import { Paper, Typography, List, ListItem, ListItemText, ListItemButton } from '@mui/material';

const MDAlertQueue = ({ onPatientSelect }) => {
  // Mock data - replace with real data in production
  const patients = [
    { id: 1, name: 'John Doe', condition: 'Hypertension', priority: 'High' },
    { id: 2, name: 'Jane Smith', condition: 'Diabetes', priority: 'Medium' },
    { id: 3, name: 'Bob Johnson', condition: 'Heart Disease', priority: 'High' },
  ];

  return (
    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Patient Queue
      </Typography>
      <List>
        {patients.map((patient) => (
          <ListItem key={patient.id} disablePadding>
            <ListItemButton onClick={() => onPatientSelect(patient)}>
              <ListItemText
                primary={patient.name}
                secondary={`${patient.condition} - ${patient.priority} Priority`}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

export default MDAlertQueue; 