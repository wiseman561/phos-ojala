import React from 'react';
import { Box, Container, Typography, Card, CardContent } from '@mui/material';

const PatientDashboard = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Patient Dashboard
        </Typography>
        <Card>
          <CardContent>
            <Typography variant="body1">
              Patient dashboard functionality coming soon.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default PatientDashboard;
