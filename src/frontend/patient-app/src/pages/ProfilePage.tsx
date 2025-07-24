import React from 'react';
import { Container, Typography, Card, CardContent, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        My Profile
      </Typography>

      <Card>
        <CardContent>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Personal Information
            </Typography>
            <Typography variant="body1">
              <strong>Name:</strong> {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="body1">
              <strong>Email:</strong> {user?.email}
            </Typography>
            <Typography variant="body1">
              <strong>Role:</strong> {user?.role}
            </Typography>
            {user?.dateOfBirth && (
              <Typography variant="body1">
                <strong>Date of Birth:</strong> {new Date(user.dateOfBirth).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default ProfilePage;
