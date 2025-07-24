import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
  Divider,
  Container,
  Tabs,
  Tab,
  Grid
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  LocalHospital as HospitalIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/auth/AuthContext';

interface LocationState {
  from?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated, isLoading: authLoading } = useAuth();

  const [tabValue, setTabValue] = useState(0);
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    phoneNumber: ''
  });
  const [errors, setErrors] = useState({
    login: '',
    register: '',
    field: {} as Record<string, string>
  });
  const [showPassword, setShowPassword] = useState({
    login: false,
    register: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const state = location.state as LocationState;
      const redirectPath = state?.from || '/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, location.state]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setErrors({ login: '', register: '', field: {} });
  };

  const validateEmail = (email: string): string => {
    if (!email) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address';
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    return '';
  };

  const handleLoginSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const emailError = validateEmail(loginData.email);
    const passwordError = validatePassword(loginData.password);

    if (emailError || passwordError) {
      setErrors({
        login: '',
        register: '',
        field: {
          loginEmail: emailError,
          loginPassword: passwordError
        }
      });
      return;
    }

    setIsLoading(true);
    setErrors({ login: '', register: '', field: {} });

    try {
      await login(loginData.email, loginData.password);
    } catch (error: any) {
      setErrors(prev => ({ ...prev, login: error.message }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const fieldErrors: Record<string, string> = {};

    if (!registerData.firstName) fieldErrors.firstName = 'First name is required';
    if (!registerData.lastName) fieldErrors.lastName = 'Last name is required';

    const emailError = validateEmail(registerData.email);
    if (emailError) fieldErrors.email = emailError;

    const passwordError = validatePassword(registerData.password);
    if (passwordError) fieldErrors.password = passwordError;

    if (registerData.password !== registerData.confirmPassword) {
      fieldErrors.confirmPassword = 'Passwords do not match';
    }

    if (!registerData.dateOfBirth) fieldErrors.dateOfBirth = 'Date of birth is required';

    if (Object.keys(fieldErrors).length > 0) {
      setErrors({ login: '', register: '', field: fieldErrors });
      return;
    }

    setIsLoading(true);
    setErrors({ login: '', register: '', field: {} });

    try {
      await register({
        firstName: registerData.firstName,
        lastName: registerData.lastName,
        email: registerData.email,
        password: registerData.password,
        dateOfBirth: registerData.dateOfBirth,
        phoneNumber: registerData.phoneNumber || undefined
      });
    } catch (error: any) {
      setErrors(prev => ({ ...prev, register: error.message }));
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field: 'login' | 'register' | 'confirm') => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
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
          py: 4,
          bgcolor: '#f8f9fa'
        }}
      >
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <HospitalIcon sx={{ fontSize: 64, color: '#2e7d32', mb: 2 }} />
          <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom color="#2e7d32">
            Patient Portal
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Ojala Healthcare Platform
          </Typography>
        </Box>

        {/* Auth Card */}
        <Card sx={{ width: '100%', maxWidth: 500 }}>
          <CardContent sx={{ p: 0 }}>
            {/* Tabs */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} centered>
                <Tab label="Sign In" />
                <Tab label="Create Account" />
              </Tabs>
            </Box>

            {/* Login Tab */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ px: 4 }}>
                <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
                  Welcome Back
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Sign in to access your health dashboard
                </Typography>

                {errors.login && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {errors.login}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleLoginSubmit} noValidate>
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                    error={!!errors.field.loginEmail}
                    helperText={errors.field.loginEmail}
                    disabled={isLoading}
                    autoComplete="email"
                    autoFocus
                    sx={{ mb: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color={errors.field.loginEmail ? 'error' : 'action'} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword.login ? 'text' : 'password'}
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                    error={!!errors.field.loginPassword}
                    helperText={errors.field.loginPassword}
                    disabled={isLoading}
                    autoComplete="current-password"
                    sx={{ mb: 3 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color={errors.field.loginPassword ? 'error' : 'action'} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => togglePasswordVisibility('login')}
                            disabled={isLoading}
                            edge="end"
                          >
                            {showPassword.login ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isLoading}
                    sx={{ mb: 2, py: 1.5, bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
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
                </Box>
              </Box>
            </TabPanel>

            {/* Register Tab */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ px: 4 }}>
                <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
                  Create Account
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Join Ojala Healthcare to manage your health
                </Typography>

                {errors.register && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {errors.register}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleRegisterSubmit} noValidate>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="First Name"
                        value={registerData.firstName}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, firstName: e.target.value }))}
                        error={!!errors.field.firstName}
                        helperText={errors.field.firstName}
                        disabled={isLoading}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon color={errors.field.firstName ? 'error' : 'action'} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Last Name"
                        value={registerData.lastName}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, lastName: e.target.value }))}
                        error={!!errors.field.lastName}
                        helperText={errors.field.lastName}
                        disabled={isLoading}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                    error={!!errors.field.email}
                    helperText={errors.field.email}
                    disabled={isLoading}
                    autoComplete="email"
                    sx={{ mb: 2, mt: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon color={errors.field.email ? 'error' : 'action'} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Date of Birth"
                        type="date"
                        value={registerData.dateOfBirth}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        error={!!errors.field.dateOfBirth}
                        helperText={errors.field.dateOfBirth}
                        disabled={isLoading}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <CalendarIcon color={errors.field.dateOfBirth ? 'error' : 'action'} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Phone (Optional)"
                        type="tel"
                        value={registerData.phoneNumber}
                        onChange={(e) => setRegisterData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                        disabled={isLoading}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword.register ? 'text' : 'password'}
                    value={registerData.password}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                    error={!!errors.field.password}
                    helperText={errors.field.password}
                    disabled={isLoading}
                    autoComplete="new-password"
                    sx={{ mb: 2, mt: 2 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color={errors.field.password ? 'error' : 'action'} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => togglePasswordVisibility('register')}
                            disabled={isLoading}
                            edge="end"
                          >
                            {showPassword.register ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Confirm Password"
                    type={showPassword.confirm ? 'text' : 'password'}
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    error={!!errors.field.confirmPassword}
                    helperText={errors.field.confirmPassword}
                    disabled={isLoading}
                    autoComplete="new-password"
                    sx={{ mb: 3 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color={errors.field.confirmPassword ? 'error' : 'action'} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => togglePasswordVisibility('confirm')}
                            disabled={isLoading}
                            edge="end"
                          >
                            {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isLoading}
                    sx={{ mb: 2, py: 1.5, bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
                  >
                    {isLoading ? (
                      <>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </Box>
              </Box>
            </TabPanel>

            <Divider sx={{ my: 3 }} />

            {/* Footer */}
            <Box sx={{ textAlign: 'center', px: 4, pb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Need help? Contact our support team
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Footer */}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
          © 2024 Ojala Healthcare. All rights reserved.
        </Typography>
      </Box>
    </Container>
  );
};

export default LoginPage;
