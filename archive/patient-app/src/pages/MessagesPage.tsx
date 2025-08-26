import React from 'react';
import { Container, Typography, Card, CardContent } from '@mui/material';

const MessagesPage: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Messages
      </Typography>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Secure Messaging
          </Typography>
          <Typography variant="body1">
            This page will display your secure messages with your care team and allow you to send new messages.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default MessagesPage;
