import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    role: 'User'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      phoneNumber,
      role
    } = formData;

    if (!firstName || !lastName || !email || !password || !phoneNumber) {
      setError('Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const result = await register({
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        phoneNumber,
        role
      });

      if (result.success) {
        // Registration successful - user should be auto-logged in by AuthContext
        navigate('/');
      } else {
        setError(result.message || 'Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Unexpected registration error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      <Typography variant="h5" component="h2" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
        Create an Account
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            name="firstName"
            label="First Name"
            fullWidth
            margin="normal"
            variant="outlined"
            value={formData.firstName}
            onChange={handleChange}
            required
            autoFocus
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            name="lastName"
            label="Last Name"
            fullWidth
            margin="normal"
            variant="outlined"
            value={formData.lastName}
            onChange={handleChange}
            required
          />
        </Grid>
      </Grid>

      <TextField
        name="email"
        label="Email Address"
        type="email"
        fullWidth
        margin="normal"
        variant="outlined"
        value={formData.email}
        onChange={handleChange}
        required
      />

      <TextField
        name="phoneNumber"
        label="Phone Number"
        type="tel"
        fullWidth
        margin="normal"
        variant="outlined"
        value={formData.phoneNumber}
        onChange={handleChange}
        required
      />

      <FormControl fullWidth margin="normal">
        <InputLabel id="role-label">Role</InputLabel>
        <Select
          labelId="role-label"
          name="role"
          value={formData.role}
          label="Role"
          onChange={handleChange}
        >
          <MenuItem value="User">User</MenuItem>
          <MenuItem value="Admin">Admin</MenuItem>
          {/* add more roles if needed */}
        </Select>
      </FormControl>

      <TextField
        name="password"
        label="Password"
        type="password"
        fullWidth
        margin="normal"
        variant="outlined"
        value={formData.password}
        onChange={handleChange}
        required
        helperText="Password must be at least 8 characters long"
      />

      <TextField
        name="confirmPassword"
        label="Confirm Password"
        type="password"
        fullWidth
        margin="normal"
        variant="outlined"
        value={formData.confirmPassword}
        onChange={handleChange}
        required
      />

      <Button
        type="submit"
        fullWidth
        variant="contained"
        color="primary"
        size="large"
        sx={{ mt: 3, mb: 2 }}
        disabled={isLoading}
      >
        {isLoading ? <CircularProgress size={24} /> : 'Sign Up'}
      </Button>

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="body2">
          Already have an account?{' '}
          <Link component={RouterLink} to="/login" variant="body2">
            Log in
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default Register;
