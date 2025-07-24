import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Container,
  Card,
  CardContent,
  InputAdornment,
  IconButton,
  Divider,
  Chip,
  Grid
} from '@mui/material';
import {
  Business,
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Security,
  Analytics,
  HealthAndSafety,
  TrendingUp
} from '@mui/icons-material';

interface LocationState {
  from?: {
    pathname: string;
  };
}

interface FormErrors {
  email?: string;
  password?: string;
}

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the intended destination or default to dashboard
  const state = location.state as LocationState;
  const from = state?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  // Real-time form validation
  const validateEmail = (emailValue: string): string | undefined => {
    if (!emailValue) return 'Email is required';
    if (!emailValue.includes('@')) return 'Please enter a valid email address';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) return 'Please enter a valid email address';
    return undefined;
  };

  const validatePassword = (passwordValue: string): string | undefined => {
    if (!passwordValue) return 'Password is required';
    if (passwordValue.length < 8) return 'Password must be at least 8 characters';
    return undefined;
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    // Clear previous error and validate
    const emailError = validateEmail(value);
    setFormErrors(prev => ({ ...prev, email: emailError }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    
    // Clear previous error and validate
    const passwordError = validatePassword(value);
    setFormErrors(prev => ({ ...prev, password: passwordError }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    if (emailError || passwordError) {
      setFormErrors({ email: emailError, password: passwordError });
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Successful login - redirect will happen via useEffect
        navigate(from, { replace: true });
      } else {
        setError(result.message || 'Login failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const isFormValid = !formErrors.email && !formErrors.password && email && password;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} alignItems="center">
          {/* Left Side - Branding & Features */}
          <Grid item xs={12} md={6}>
            <Box sx={{ color: 'white', textAlign: { xs: 'center', md: 'left' } }}>
              <Business sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h3" fontWeight="bold" gutterBottom>
                Ojala Employer Portal
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 4, fontWeight: 300 }}>
                Comprehensive employee health analytics and benefits management
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Analytics sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="h6" fontWeight={500}>Health Analytics</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Real-time insights into your workforce health trends
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUp sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="h6" fontWeight={500}>Cost Optimization</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Track healthcare costs and ROI on wellness programs
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <HealthAndSafety sx={{ fontSize: 32 }} />
                  <Box>
                    <Typography variant="h6" fontWeight={500}>Compliance Management</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                      Ensure regulatory compliance with automated reporting
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                <Chip 
                  icon={<Security />}
                  label="HIPAA Compliant"
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
                <Chip 
                  icon={<Analytics />}
                  label="Real-time Analytics"
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
                <Chip 
                  label="Enterprise Grade"
                  sx={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)', 
                    color: 'white'
                  }}
                />
              </Box>
            </Box>
          </Grid>

          {/* Right Side - Login Form */}
          <Grid item xs={12} md={6}>
            <Card 
              elevation={12}
              sx={{
                maxWidth: 480,
                mx: 'auto',
                borderRadius: 3,
                overflow: 'hidden',
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(10px)'
              }}
            >
              {/* Header */}
              <Box
                sx={{
                  background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                  color: 'white',
                  p: 3,
                  textAlign: 'center'
                }}
              >
                <Business sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5" fontWeight="bold">
                  Employer Sign In
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                  Access your organization's health dashboard
                </Typography>
              </Box>

              <CardContent sx={{ p: 4 }}>
                {/* Login Form */}
                <Box component="form" onSubmit={handleSubmit}>
                  {error && (
                    <Alert 
                      severity="error" 
                      sx={{ mb: 3, borderRadius: 2 }}
                      onClose={() => setError('')}
                    >
                      {error}
                    </Alert>
                  )}

                  <TextField
                    fullWidth
                    label="Business Email Address"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    error={!!formErrors.email}
                    helperText={formErrors.email}
                    disabled={isLoading}
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email color="action" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    error={!!formErrors.password}
                    helperText={formErrors.password}
                    disabled={isLoading}
                    margin="normal"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleTogglePasswordVisibility}
                            edge="end"
                            disabled={isLoading}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                      },
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={isLoading || !isFormValid}
                    sx={{
                      mt: 3,
                      mb: 2,
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      background: 'linear-gradient(45deg, #1565c0, #1976d2)',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1565c0, #0d47a1)',
                      },
                      '&:disabled': {
                        background: '#ccc',
                      },
                    }}
                    startIcon={
                      isLoading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <Business />
                      )
                    }
                  >
                    {isLoading ? 'Signing In...' : 'Sign In to Dashboard'}
                  </Button>
                </Box>

                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    For Authorized Employers Only
                  </Typography>
                </Divider>

                {/* Information Section */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    This portal is restricted to authorized employers and HR administrators 
                    with valid organizational access credentials.
                  </Typography>
                  
                  <Typography variant="body2" color="text.secondary">
                    Need help accessing your account? Contact your IT administrator or 
                    Ojala Healthcare support.
                  </Typography>
                </Box>

                {/* Demo Info (for development) */}
                {process.env.NODE_ENV === 'development' && (
                  <Box 
                    sx={{ 
                      mt: 3, 
                      p: 2, 
                      backgroundColor: '#f5f5f5', 
                      borderRadius: 2,
                      border: '1px dashed #ccc'
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" display="block">
                      <strong>Development Mode:</strong> Use your employer credentials to access the system
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
            © 2024 Ojala Healthcare • Enterprise • Secure • Compliant
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default LoginPage; 