import React from 'react';
import { Container, Typography, Card, CardContent } from '@mui/material';

const AppointmentsPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        My Appointments
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Upcoming Appointments
          </Typography>
          <Typography variant="body1">
            This page will display your scheduled appointments, allow you to book new ones, and manage existing appointments.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default AppointmentsPage;
