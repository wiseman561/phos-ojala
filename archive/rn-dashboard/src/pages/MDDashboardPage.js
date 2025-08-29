import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Breadcrumbs,
  Link,
  Paper,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { Home as HomeIcon, NavigateNext as NavigateNextIcon } from '@mui/icons-material';

// Import custom components
import MDAlertQueue from '../components/MDAlertQueue';
import CarePlanApprovalModal from '../components/CarePlanApprovalModal';
import ConditionFilterBar from '../components/ConditionFilterBar';
import QuickNotesBox from '../components/QuickNotesBox';

// Import shared components
import PatientSummaryCard from '../components/patient-list/PatientCard';
import VitalsTrendChart from '../components/health-score/HealthScoreCard';
import AlertTimeline from '../components/alerts/AlertCard';

/**
 * MD Dashboard Page
 *
 * Main dashboard for physicians to review patients escalated by RNs or the AI engine,
 * approve care plans, and oversee long-term outcomes.
 */
const MDDashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showCarePlanModal, setShowCarePlanModal] = useState(false);
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    // In a real app, this would fetch additional patient data
  };

  const handleOpenCarePlan = () => {
    if (selectedPatient) {
      setShowCarePlanModal(true);
    }
  };

  const handleCloseCarePlan = () => {
    setShowCarePlanModal(false);
  };

  const handleApproveCarePlan = (patientId, notes) => {
    // In a real app, this would call an API to approve the care plan
    console.log(`Approved care plan for patient ${patientId} with notes: ${notes}`);
    setNotification({
      open: true,
      message: 'Care plan approved successfully',
      severity: 'success'
    });
  };

  const handleSendBackCarePlan = (patientId, notes) => {
    // In a real app, this would call an API to send the care plan back to RN
    console.log(`Sent care plan back to RN for patient ${patientId} with notes: ${notes}`);
    setNotification({
      open: true,
      message: 'Care plan sent back to RN for revision',
      severity: 'info'
    });
  };

  const handleFilterChange = (conditions) => {
    setSelectedConditions(conditions);
    // In a real app, this would filter the patient list
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs navigation */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <Link
          color="inherit"
          href="/dashboard"
          sx={{ display: 'flex', alignItems: 'center' }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Home
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          MD Dashboard
        </Typography>
      </Breadcrumbs>

      {/* Page title */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          MD Clinical Dashboard
        </Typography>
      </Box>

      {/* Condition filter bar */}
      <ConditionFilterBar onFilterChange={handleFilterChange} />

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Left column - Patient queue */}
          <Grid item xs={12} md={6} lg={4}>
            <MDAlertQueue onPatientSelect={handlePatientSelect} />
          </Grid>

          {/* Right column - Selected patient details */}
          <Grid item xs={12} md={6} lg={8}>
            {selectedPatient ? (
              <>
                <Grid container spacing={3}>
                  {/* Patient summary card */}
                  <Grid item xs={12}>
                    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">
                          Patient Summary
                        </Typography>
                        <Box>
                          <Link
                            component="button"
                            variant="body2"
                            onClick={handleOpenCarePlan}
                            sx={{ ml: 2 }}
                          >
                            Review Care Plan
                          </Link>
                        </Box>
                      </Box>
                      <PatientSummaryCard patient={selectedPatient} />
                    </Paper>
                  </Grid>

                  {/* Vitals trend chart */}
                  <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                      <Typography variant="h6" gutterBottom>
                        Health Score & Vitals Trend
                      </Typography>
                      <VitalsTrendChart patientId={selectedPatient.id} />
                    </Paper>
                  </Grid>

                  {/* Alert timeline */}
                  <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ p: 2, height: '100%' }}>
                      <Typography variant="h6" gutterBottom>
                        Alert Timeline
                      </Typography>
                      <AlertTimeline patientId={selectedPatient.id} mdFiltered={true} />
                    </Paper>
                  </Grid>

                  {/* Quick notes box */}
                  <Grid item xs={12}>
                    <QuickNotesBox patientId={selectedPatient.id} patientName={selectedPatient.name} />
                  </Grid>
                </Grid>

                {/* Care plan approval modal */}
                <CarePlanApprovalModal
                  open={showCarePlanModal}
                  onClose={handleCloseCarePlan}
                  patient={selectedPatient}
                  onApprove={handleApproveCarePlan}
                  onSendBack={handleSendBackCarePlan}
                />
              </>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '70vh',
                  bgcolor: 'background.default',
                  border: '1px dashed',
                  borderColor: 'divider'
                }}
              >
                <Typography variant="h6" color="textSecondary" align="center" gutterBottom>
                  Select a patient from the queue to view details
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                  Patient information, vitals, alerts, and care plan will appear here
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      )}

      {/* Notification snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default MDDashboardPage;
