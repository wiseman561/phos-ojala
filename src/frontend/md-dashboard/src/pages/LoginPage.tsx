import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  LocalHospital as HospitalIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/auth/AuthContext';

interface LocationState {
  from?: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [errors, setErrors] = useState({
    email: '',
    password: '',
    general: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const state = location.state as LocationState;
      const redirectPath = state?.from || '/escalated-alerts';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, location]);

  const validateEmail = (email: string): string => {
    if (!email) return 'Email is required';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Email is invalid';
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return '';
  };

  const handleInputChange = (field: 'email' | 'password') => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: event.target.value }));
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Validate form
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    if (emailError || passwordError) {
      setErrors({
        email: emailError,
        password: passwordError,
        general: ''
      });
      return;
    }

    setIsLoading(true);
    setErrors({ email: '', password: '', general: '' });

    try {
      console.log('[LoginPage] Attempting login with:', formData.email);
      const result = await login(formData.email, formData.password);

      if (result.success) {
        console.log('[LoginPage] Login successful, redirecting to escalated-alerts');
        // Success - redirect to escalated alerts for MD dashboard
        navigate('/escalated-alerts', { replace: true });
      } else {
        console.log('[LoginPage] Login failed:', result.message);
        // Handle login failure
        setErrors(prev => ({
          ...prev,
          general: result.message || 'Login failed. Please try again later.'
        }));
      }

    } catch (error: any) {
      console.error('[LoginPage] Login error:', error);

      // Handle specific error types
      if (error.message?.includes('Invalid email or password')) {
        setErrors(prev => ({
          ...prev,
          general: 'Invalid email or password. Please check your credentials and try again.'
        }));
      } else if (error.message?.includes('Access denied')) {
        setErrors(prev => ({
          ...prev,
          general: 'Access denied. This dashboard is only available to physicians and medical doctors.'
        }));
      } else if (error.message?.includes('Network Error')) {
        setErrors(prev => ({
          ...prev,
          general: 'Network error. Please check your internet connection and try again.'
        }));
      } else {
        setErrors(prev => ({
          ...prev,
          general: error.message || 'Login failed. Please try again later.'
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          py: 4
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <HospitalIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
          <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
            MD Dashboard
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Ojala Healthcare Platform
          </Typography>
        </Box>

        {/* Login Card */}
        <Card sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
              Sign In
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Access your physician dashboard
            </Typography>

            {/* General Error Alert */}
            {errors.general && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {errors.general}
              </Alert>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit} noValidate>
              {/* Email Field */}
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                error={!!errors.email}
                helperText={errors.email}
                disabled={isLoading}
                autoComplete="email"
                autoFocus
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color={errors.email ? 'error' : 'action'} />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Password Field */}
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange('password')}
                error={!!errors.password}
                helperText={errors.password}
                disabled={isLoading}
                autoComplete="current-password"
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color={errors.password ? 'error' : 'action'} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={togglePasswordVisibility}
                        disabled={isLoading}
                        edge="end"
                        aria-label="toggle password visibility"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{ mb: 2, py: 1.5 }}
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              {/* Test Credentials Info */}
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Test Credentials:</strong><br />
                  Email: <code>doctor@ojala-healthcare.com</code><br />
                  Password: <code>Password123!</code>
                </Typography>
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  <strong>Note:</strong> Make sure to type the email exactly as shown (no extra characters)
                </Typography>
              </Alert>

              {/* Test Mock Server Button */}
              <Button
                variant="outlined"
                fullWidth
                onClick={() => {
                  console.log('[LoginPage] Testing mock server...');
                  const axios = require('axios');
                  axios.get('/api/test').then((response: any) => {
                    console.log('[LoginPage] Mock server test response:', response.data);
                  }).catch((error: any) => {
                    console.log('[LoginPage] Mock server test error:', error);
                  });
                }}
                sx={{ mt: 2 }}
              >
                Test Mock Server
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default LoginPage;
