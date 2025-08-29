import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

/**
 * RoleRedirect Component
 *
 * Handles role-based redirection after login or when accessing the /dashboard route.
 * Redirects users to their appropriate dashboard based on their role.
 */
const RoleRedirect = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // If no user is logged in, redirect to login
        navigate('/login');
      } else {
        // Redirect based on role
        switch (user.role) {
          case 'admin':
            navigate('/admin/dashboard');
            break;
          case 'md':
            navigate('/md/dashboard');
            break;
          case 'rn':
            navigate('/rn/dashboard');
            break;
          default:
            // If role is not recognized, redirect to unauthorized
            navigate('/unauthorized');
        }
      }
    }
  }, [user, loading, navigate]);

  // Show loading spinner while checking auth state
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
    >
      <CircularProgress />
    </Box>
  );
};

export default RoleRedirect;
