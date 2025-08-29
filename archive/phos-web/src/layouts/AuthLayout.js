import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container, Paper, Typography, Grid } from '@mui/material';
import { HealthAndSafety as HealthAndSafetyIcon } from '@mui/icons-material';

const AuthLayout = () => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'primary.light',
        backgroundImage: 'linear-gradient(315deg, #1976d2 0%, #42a5f5 74%)',
        py: 4
      }}
    >
      <Container maxWidth="md">
        <Grid container spacing={4}>
          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Box sx={{ color: 'white', mb: 4, textAlign: { xs: 'center', md: 'left' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'center', md: 'flex-start' }, mb: 2 }}>
                <HealthAndSafetyIcon sx={{ fontSize: 40, mr: 1 }} />
                <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                  Phos Healthcare
                </Typography>
              </Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Transforming Healthcare Management
              </Typography>
              <Typography variant="body1">
                A comprehensive platform for healthcare providers to manage patients, appointments, medical records, and healthcare plans efficiently.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
              <Outlet />
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default AuthLayout;
