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
import apiClient from '../api/axios';
import { PatientDetail as PatientDetailType } from '../mocks/mockPatients';

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

  const patientId = id ? parseInt(id, 10) : 1;

  // Fetch patient details
  useEffect(() => {
    fetchPatientDetail();
  }, [patientId]);

  const fetchPatientDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get<PatientDetailType>(`/patients/${patientId}`);
      setPatient(response.data);
    } catch (err) {
      setError('Error loading patient details. Please try again.');
      console.error('Error fetching patient details:', err);
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

          {/* Patient Header */}
          {patient && !loading && !error && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 0 }}>
                {patient.name}
              </Typography>
              <Chip
                label={`Health Score: ${patient.healthScore}`}
                color={getHealthScoreColor(patient.healthScore)}
                size="medium"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>
          )}
                </Box>

        {/* Patient Details Content */}
        {patient && !loading && !error && (
          <Grid container spacing={3}>
        {/* Patient Information */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Patient Information
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <List>
                <ListItem>
                  <ListItemText primary="Age" secondary={`${patient.age} years old`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Condition" secondary={patient.condition} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Phone" secondary={patient.phone} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Email" secondary={patient.email} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Address" secondary={patient.address} />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Care Team & Dates */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Care Team & Timeline
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Admission Date
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {new Date(patient.admissionDate).toLocaleDateString()}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Primary Physician
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {patient.primaryPhysician}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Assigned Nurse
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {patient.nurseAssigned}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Current Vitals */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Current Vitals
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Heart Rate
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {patient.vitals.heartRate} bpm
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Blood Pressure
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {patient.vitals.bloodPressure}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Temperature
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {patient.vitals.temperature}°F
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={6}>
                  <Paper elevation={0} sx={{ p: 2, backgroundColor: 'grey.50' }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      O2 Saturation
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {patient.vitals.oxygenSaturation}%
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Medications & Allergies */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Medications & Allergies
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Current Medications
                </Typography>
                {patient.medications.map((medication, index) => (
                  <Chip
                    key={index}
                    label={medication}
                    variant="outlined"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                  Allergies
                </Typography>
                {patient.allergies.map((allergy, index) => (
                  <Chip
                    key={index}
                    label={allergy}
                    color="error"
                    variant="outlined"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
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
              <Divider sx={{ mb: 2 }} />

              {patient.recentAlerts.map((alert, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    mb: 1,
                    backgroundColor: 'grey.50',
                    borderRadius: 1,
                  }}
                >
                  <Box>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {alert.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {alert.time}
                    </Typography>
                  </Box>
                  <Chip
                    label={alert.severity.toUpperCase()}
                    color={getAlertSeverityColor(alert.severity)}
                    size="small"
                  />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
          </Grid>
        )}
      </Container>
    </>
  );
};

export default PatientDetail;
