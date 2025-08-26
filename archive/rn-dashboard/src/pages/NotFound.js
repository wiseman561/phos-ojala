import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon } from '@mui/icons-material';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        textAlign="center"
      >
        <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="textSecondary" paragraph>
          The page you're looking for doesn't exist or has been moved.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/dashboard')}
          sx={{ mt: 2 }}
        >
          Go to Dashboard
        </Button>
      </Box>
    </Container>
  );
};

export default NotFound;
