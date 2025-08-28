import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Box,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  AppBar,
  Toolbar,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  MonitorHeart,
  Medication,
  Warning,
  Phone,
  Email,
  LocationOn,
  Person,
  CalendarToday,
  Assignment,
  LocalHospital
} from '@mui/icons-material';
import { PatientDetail as PatientDetailType } from '../services/patientService';
import patientService from '../services/patientService';

const getHealthScoreColor = (score: number): 'error' | 'warning' | 'success' => {
  if (score < 60) return 'error';
  if (score <= 80) return 'warning';
  return 'success';
};

const getAlertSeverityColor = (severity: string): 'error' | 'warning' | 'info' => {
  switch (severity) {
    case 'high': return 'error';
    case 'medium': return 'warning';
    case 'low': return 'info';
    default: return 'info';
  }
};

const PatientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<PatientDetailType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const patientId = id || '';

  // Fetch patient details
  useEffect(() => {
    if (patientId) {
      fetchPatientDetail();
    }
  }, [patientId]);

  const fetchPatientDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`[PatientDetail] Fetching patient details for ID: ${patientId}`);
      const patientData = await patientService.getPatientDetail(patientId);
      setPatient(patientData);
      console.log(`[PatientDetail] Successfully loaded patient: ${patientData.name || 'Unknown'}`);
    } catch (err) {
      const errorMessage = 'Error loading patient details. Please try again.';
      setError(errorMessage);
      console.error('[PatientDetail] Error fetching patient details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/patient-queue');
  };

  const handleNavigateToAlerts = () => {
    navigate('/escalated-alerts');
  };

  if (!patientId) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Invalid patient ID</Alert>
        <Button onClick={handleBack} sx={{ mt: 2 }}>
          Back to Patient Queue
        </Button>
      </Container>
    );
  }

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
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            onClick={handleBack}
            sx={{ mb: 2 }}
          >
            ← Back to Patient Queue
          </Button>

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
                onClick={fetchPatientDetail}
                variant="outlined"
                sx={{ ml: 2 }}
                size="small"
              >
                Retry
              </Button>
            </Alert>
          )}

          {/* Patient Details */}
          {patient && !loading && !error && (
            <>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
                {patient.name || `${patient.firstName || 'Unknown'} ${patient.lastName || 'Patient'}`}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Chip
                  label={`Health Score: ${patient.healthScore || 'N/A'}`}
                  color={patient.healthScore ? getHealthScoreColor(patient.healthScore) : 'default'}
                  size="medium"
                  sx={{ fontWeight: 'bold' }}
                />
                <Chip
                  label={`Age: ${patient.age || 'Unknown'}`}
                  variant="outlined"
                  size="medium"
                />
                <Chip
                  label={patient.condition || 'General Care'}
                  variant="outlined"
                  size="medium"
                />
              </Box>

              <Grid container spacing={3}>
                {/* Patient Information */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Patient Information
                      </Typography>
                      <List dense>
                        <ListItem>
                          <ListItemIcon>
                            <Person />
                          </ListItemIcon>
                          <ListItemText
                            primary="Name"
                            secondary={patient.name || `${patient.firstName || 'Unknown'} ${patient.lastName || 'Patient'}`}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Email />
                          </ListItemIcon>
                          <ListItemText
                            primary="Email"
                            secondary={patient.email || 'Not provided'}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Phone />
                          </ListItemIcon>
                          <ListItemText
                            primary="Phone"
                            secondary={patient.phoneNumber || 'Not provided'}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <LocationOn />
                          </ListItemIcon>
                          <ListItemText
                            primary="Address"
                            secondary={patient.address || 'Not provided'}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <CalendarToday />
                          </ListItemIcon>
                          <ListItemText
                            primary="Date of Birth"
                            secondary={patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'Not provided'}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemIcon>
                            <Assignment />
                          </ListItemIcon>
                          <ListItemText
                            primary="Gender"
                            secondary={patient.gender || 'Not specified'}
                          />
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Vitals */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Vital Signs
                      </Typography>
                      {patient.vitals ? (
                        <List dense>
                          <ListItem>
                            <ListItemIcon>
                              <MonitorHeart />
                            </ListItemIcon>
                            <ListItemText
                              primary="Heart Rate"
                              secondary={`${patient.vitals.heartRate || 'N/A'} bpm`}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <MonitorHeart />
                            </ListItemIcon>
                            <ListItemText
                              primary="Blood Pressure"
                              secondary={patient.vitals.bloodPressure || 'N/A'}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <MonitorHeart />
                            </ListItemIcon>
                            <ListItemText
                              primary="Temperature"
                              secondary={`${patient.vitals.temperature || 'N/A'}°F`}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemIcon>
                              <MonitorHeart />
                            </ListItemIcon>
                            <ListItemText
                              primary="Oxygen Saturation"
                              secondary={`${patient.vitals.oxygenSaturation || 'N/A'}%`}
                            />
                          </ListItem>
                        </List>
                      ) : (
                        <Typography color="text.secondary">
                          No vital signs recorded
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Medications */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Medications
                      </Typography>
                      {patient.medications && patient.medications.length > 0 ? (
                        <List dense>
                          {patient.medications.map((medication, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <Medication />
                              </ListItemIcon>
                              <ListItemText primary={medication} />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography color="text.secondary">
                          No medications recorded
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Allergies */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Allergies
                      </Typography>
                      {patient.allergies && patient.allergies.length > 0 ? (
                        <List dense>
                          {patient.allergies.map((allergy, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <Warning color="warning" />
                              </ListItemIcon>
                              <ListItemText primary={allergy} />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography color="text.secondary">
                          No allergies recorded
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Recent Alerts */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Recent Alerts
                      </Typography>
                      {patient.recentAlerts && patient.recentAlerts.length > 0 ? (
                        <List>
                          {patient.recentAlerts.map((alert, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <Warning color={getAlertSeverityColor(alert.severity)} />
                              </ListItemIcon>
                              <ListItemText
                                primary={alert.message}
                                secondary={alert.time}
                              />
                              <Chip
                                label={alert.severity}
                                color={getAlertSeverityColor(alert.severity)}
                                size="small"
                              />
                            </ListItem>
                          ))}
                        </List>
                      ) : (
                        <Typography color="text.secondary">
                          No recent alerts
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Care Plan Information */}
                {patient.activePlan && (
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                          Active Care Plan
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                          <LocalHospital />
                          <Typography variant="subtitle1">
                            {patient.activePlan.planName || 'Care Plan'}
                          </Typography>
                          <Chip
                            label={patient.activePlan.status || 'Active'}
                            color="primary"
                            size="small"
                          />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Start Date: {patient.activePlan.startDate ? new Date(patient.activePlan.startDate).toLocaleDateString() : 'Not specified'}
                        </Typography>
                        {patient.activePlan.endDate && (
                          <Typography variant="body2" color="text.secondary">
                            End Date: {new Date(patient.activePlan.endDate).toLocaleDateString()}
                          </Typography>
                        )}
                        {patient.activePlan.goals && patient.activePlan.goals.length > 0 && (
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                              Goals:
                            </Typography>
                            <List dense>
                              {patient.activePlan.goals.map((goal, index) => (
                                <ListItem key={index}>
                                  <ListItemText primary={goal} />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </>
          )}
        </Box>
      </Container>
    </>
  );
};

export default PatientDetail;
