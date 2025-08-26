import React from 'react';
import { Box, Container, Typography, Card, CardContent } from '@mui/material';

const EmployerDashboard = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Employer Dashboard
        </Typography>
        <Card>
          <CardContent>
            <Typography variant="body1">
              Employer dashboard functionality coming soon.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default EmployerDashboard;
