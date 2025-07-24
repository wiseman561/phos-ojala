import React from 'react';
import { 
  Box, 
  Container, 
  Paper, 
  Typography, 
  Button, 
  Alert 
} from '@mui/material';
import { 
  ShieldExclamation as ShieldExclamationIcon,
  Home as HomeIcon,
  ArrowBack as ArrowBackIcon 
} from '@mui/icons-material';

const Unauthorized: React.FC = () => {
  const handleGoHome = () => {
    window.location.href = '/admin/dashboard';
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'grey.100',
        backgroundImage: 'linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%)',
        py: 3,
        px: 2
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            p: 4,
            borderRadius: 2,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            textAlign: 'center'
          }}
        >
          {/* Error Icon */}
          <Box sx={{ mb: 3 }}>
            <ShieldExclamationIcon 
              sx={{ 
                fontSize: 80, 
                color: 'error.main',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
              }} 
            />
          </Box>

          {/* Error Title */}
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 'bold',
              color: 'error.main',
              mb: 2
            }}
          >
            Access Denied
          </Typography>

          {/* Error Description */}
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            You don't have permission to view this page
          </Typography>

          {/* Additional Info Alert */}
          <Alert 
            severity="warning" 
            sx={{ 
              mb: 4, 
              textAlign: 'left',
              '& .MuiAlert-message': {
                width: '100%'
              }
            }}
          >
            <Typography variant="body2">
              <strong>What happened?</strong>
              <br />
              You attempted to access a page that requires specific administrative privileges. 
              Your current role may not have sufficient permissions for this resource.
            </Typography>
          </Alert>

          {/* Action Buttons */}
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              justifyContent: 'center',
              alignItems: 'center'
            }}
          >
            <Button
              variant="contained"
              size="large"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
              sx={{
                px: 3,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 'bold',
                borderRadius: 2,
                background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5a6fd8 30%, #6a4190 90%)',
                },
                minWidth: 180
              }}
            >
              Go to Dashboard
            </Button>

            <Button
              variant="outlined"
              size="large"
              startIcon={<ArrowBackIcon />}
              onClick={handleGoBack}
              sx={{
                px: 3,
                py: 1.5,
                fontSize: '1rem',
                borderRadius: 2,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': {
                  borderColor: 'primary.dark',
                  backgroundColor: 'primary.light',
                },
                minWidth: 180
              }}
            >
              Go Back
            </Button>
          </Box>

          {/* Help Text */}
          <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'grey.200' }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ lineHeight: 1.6 }}
            >
              If you believe you should have access to this page, please contact your system administrator 
              or check your role permissions.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Unauthorized; 