import React from 'react';
import { Container, Typography, Card, CardContent } from '@mui/material';

const SettingsPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Settings
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Application Settings
          </Typography>
          <Typography variant="body1">
            This page will allow you to manage your notification preferences, privacy settings, and account preferences.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default SettingsPage;
