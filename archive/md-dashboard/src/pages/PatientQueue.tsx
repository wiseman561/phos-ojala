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
import { AccountCircle, Logout, PersonOff } from '@mui/icons-material';
import { Patient } from '../services/patientService';
import { useAuth } from '../hooks/useAuth';
import patientService from '../services/patientService';

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

  // Fetch patients on component mount
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('[PatientQueue] Fetching patients...');
      const patientsData = await patientService.getPatients();
      setPatients(patientsData);
      console.log(`[PatientQueue] Loaded ${patientsData.length} patients`);
    } catch (err) {
      const errorMessage = 'Error loading patients. Please try again.';
      setError(errorMessage);
      console.error('[PatientQueue] Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (patientId: string) => {
    console.log(`[PatientQueue] Navigating to patient detail: ${patientId}`);
    navigate(`/patient/${patientId}`);
  };

  const handleAssignRN = async (patientId: string, patientName: string) => {
    try {
      console.log(`[PatientQueue] Assigning RN to patient: ${patientName} (${patientId})`);
      const result = await patientService.assignRN(patientId);
      console.log(`[PatientQueue] RN assigned to ${patientName}:`, result);
      // You could show a success message here
    } catch (err) {
      console.error(`[PatientQueue] Error assigning RN to ${patientName}:`, err);
    }
  };

  const handleEscalate = async (patientId: string, patientName: string) => {
    try {
      console.log(`[PatientQueue] Escalating patient: ${patientName} (${patientId})`);
      const result = await patientService.escalatePatient(patientId);
      console.log(`[PatientQueue] ${patientName} escalated to MD:`, result);
      // You could show a success message here
    } catch (err) {
      console.error(`[PatientQueue] Error escalating ${patientName}:`, err);
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
                {user?.firstName?.charAt(0) || 'D'}
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
                {`${user?.firstName} ${user?.lastName}` || user?.email}
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

        {/* Empty State */}
        {!loading && !error && patients.length === 0 && (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 8,
            textAlign: 'center'
          }}>
            <PersonOff sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom>
              No patients yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Patients will appear here once they are registered in the system.
            </Typography>
            <Button
              variant="contained"
              onClick={fetchPatients}
              sx={{ mr: 2 }}
            >
              Refresh
            </Button>
          </Box>
        )}

        {/* Patients Grid */}
        {!loading && !error && patients.length > 0 && (
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
                        {patient.name || `${patient.firstName || 'Unknown'} ${patient.lastName || 'Patient'}`}
                      </Typography>
                      <Chip
                        label={patient.healthScore || 'N/A'}
                        color={patient.healthScore ? getHealthScoreColor(patient.healthScore) : 'default'}
                        size="small"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </Box>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Age: {patient.age || 'Unknown'}
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
                        {patient.condition || 'General Care'}
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
                            width: `${patient.healthScore || 0}%`,
                            height: '100%',
                            backgroundColor:
                              (patient.healthScore || 0) < 60 ? 'error.main' :
                              (patient.healthScore || 0) <= 80 ? 'warning.main' : 'success.main',
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
                      onClick={() => handleView(patient.id || '')}
                      sx={{ mr: 1 }}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => handleAssignRN(patient.id || '', patient.name || 'Patient')}
                      sx={{ mr: 1 }}
                    >
                      Assign RN
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      onClick={() => handleEscalate(patient.id || '', patient.name || 'Patient')}
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
