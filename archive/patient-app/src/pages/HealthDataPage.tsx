import React from 'react';
import { Container, Typography, Card, CardContent } from '@mui/material';

const HealthDataPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Health Data
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Health Information
          </Typography>
          <Typography variant="body1">
            This page will display your health metrics, vitals history, lab results, and other medical data.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default HealthDataPage;
