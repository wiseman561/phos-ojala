import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Box,
  Paper,
  AppBar,
  Toolbar,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  IconButton,
  Avatar,
} from '@mui/material';
import { AccountCircle, Logout } from '@mui/icons-material';
import apiClient from '../api/axios';
import { setupMockServer } from '../api/mockServer';
import { Patient } from '../mocks/mockPatients';
import { useAuth } from '../hooks/useAuth';

const getHealthScoreColor = (score: number): 'error' | 'warning' | 'success' => {
  if (score < 60) return 'error';
  if (score <= 80) return 'warning';
  return 'success';
};

const PatientQueue: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Initialize mock server and fetch patients
  useEffect(() => {
    setupMockServer();
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<Patient[]>('/patients');
      setPatients(response.data);
    } catch (err) {
      setError('Error loading patients. Please try again.');
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (patientId: number) => {
    navigate(`/patient/${patientId}`);
  };

  const handleAssignRN = async (patientId: number, patientName: string) => {
    try {
      const response = await apiClient.post(`/patients/${patientId}/assign-rn`);
      console.log(`RN assigned to ${patientName}:`, response.data);
      // You could show a success message here
    } catch (err) {
      console.error(`Error assigning RN to ${patientName}:`, err);
    }
  };

  const handleEscalate = async (patientId: number, patientName: string) => {
    try {
      const response = await apiClient.post(`/patients/${patientId}/escalate`);
      console.log(`${patientName} escalated to MD:`, response.data);
      // You could show a success message here
    } catch (err) {
      console.error(`Error escalating ${patientName}:`, err);
    }
  };

  const handleNavigateToAlerts = () => {
    navigate('/escalated-alerts');
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Navigation Header */}
      <AppBar position="static" sx={{ mb: 4 }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            MD Dashboard
          </Typography>
          <Button color="inherit" onClick={() => navigate('/patient-queue')}>
            Patient Queue
          </Button>
          <Button color="inherit" onClick={handleNavigateToAlerts}>
            Escalated Alerts
          </Button>

          {/* User Profile Menu */}
          <Box sx={{ ml: 2 }}>
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="profile-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.dark' }}>
                {user?.name?.charAt(0) || user?.firstName?.charAt(0) || 'D'}
              </Avatar>
            </IconButton>
            <Menu
              id="profile-menu"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
            >
              <MenuItem onClick={handleProfileMenuClose} disabled>
                <AccountCircle sx={{ mr: 1 }} />
                {user?.name || `${user?.firstName} ${user?.lastName}` || user?.email}
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

            <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
          Patient Queue
        </Typography>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress size={60} />
          </Box>
        )}

        {/* Error State */}
        {error && !loading && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
            <Button
              onClick={fetchPatients}
              variant="outlined"
              sx={{ ml: 2 }}
              size="small"
            >
              Retry
            </Button>
          </Alert>
        )}

        {/* Patients Grid */}
        {!loading && !error && (
          <Grid container spacing={3}>
            {patients.map((patient) => (
          <Grid item xs={12} sm={6} md={4} key={patient.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                    {patient.name}
                  </Typography>
                  <Chip
                    label={patient.healthScore}
                    color={getHealthScoreColor(patient.healthScore)}
                    size="small"
                    sx={{ fontWeight: 'bold' }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Age: {patient.age}
                </Typography>

                <Paper
                  elevation={0}
                  sx={{
                    p: 1,
                    backgroundColor: 'grey.50',
                    borderRadius: 1,
                    mb: 2,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {patient.condition}
                  </Typography>
                </Paper>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Health Score:
                  </Typography>
                  <Box
                    sx={{
                      width: '100%',
                      height: 6,
                      backgroundColor: 'grey.200',
                      borderRadius: 3,
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        width: `${patient.healthScore}%`,
                        height: '100%',
                        backgroundColor:
                          patient.healthScore < 60 ? 'error.main' :
                          patient.healthScore <= 80 ? 'warning.main' : 'success.main',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </Box>
                </Box>
              </CardContent>

              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleView(patient.id)}
                  sx={{ mr: 1 }}
                >
                  View
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={() => handleAssignRN(patient.id, patient.name)}
                  sx={{ mr: 1 }}
                >
                  Assign RN
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  onClick={() => handleEscalate(patient.id, patient.name)}
                >
                  Escalate
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
          </Grid>
        )}
      </Container>
    </>
  );
};

export default PatientQueue;
