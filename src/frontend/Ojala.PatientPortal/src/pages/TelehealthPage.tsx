import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Fab,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  VideoCall,
  ArrowBack,
  Add,
  Schedule,
  Person,
  LocationOn,
  AccessTime,
  Phone,
  CalendarToday,
  Computer,
  LocalHospital,
  Message,
  Cancel,
  Edit,
  Send,
} from '@mui/icons-material';
import { format, isAfter, isBefore, addMinutes } from 'date-fns';

import { useAuth } from '../contexts/auth/AuthContext';
import { patientApi, handleApiError } from '../services/apiClient';

// TypeScript interfaces
interface TelehealthSession {
  id: string;
  providerName: string;
  scheduledAt: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled' | 'In Progress';
  durationMinutes: number;
  reason: string;
  specialty?: string;
  providerAvatar?: string;
  joinUrl?: string;
  notes?: string;
}

interface AppointmentRequest {
  preferredDateTime: string;
  reason: string;
  providerId?: string;
  urgency: 'routine' | 'urgent' | 'emergency';
}

const TelehealthPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [sessions, setSessions] = useState<TelehealthSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  // Form state for appointment request
  const [appointmentForm, setAppointmentForm] = useState<AppointmentRequest>({
    preferredDateTime: '',
    reason: '',
    urgency: 'routine',
  });

  // Load telehealth sessions
  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call with mock data
      // TODO: Replace with actual API call: patientApi.telehealth.getSessions('patient')
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockSessions: TelehealthSession[] = [
        {
          id: 'session-1',
          providerName: 'Dr. Smith',
          scheduledAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
          status: 'Scheduled',
          durationMinutes: 30,
          reason: 'Annual checkup',
          specialty: 'Family Medicine',
        },
        {
          id: 'session-2',
          providerName: 'Dr. Johnson',
          scheduledAt: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
          status: 'Scheduled',
          durationMinutes: 45,
          reason: 'Follow-up consultation',
          specialty: 'Cardiology',
        },
        {
          id: 'session-3',
          providerName: 'Dr. Williams',
          scheduledAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          status: 'Completed',
          durationMinutes: 30,
          reason: 'Medication review',
          specialty: 'Internal Medicine',
        },
      ];

      setSessions(mockSessions);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Submit appointment request
  const handleRequestAppointment = async () => {
    try {
      setSubmittingRequest(true);
      setError(null);

      // Validate form
      if (!appointmentForm.preferredDateTime || !appointmentForm.reason.trim()) {
        setError('Please fill in all required fields');
        return;
      }

      // Simulate API call
      // TODO: Replace with actual API call: patientApi.telehealth.scheduleSession(appointmentForm)
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Close dialog and reload sessions
      setRequestDialogOpen(false);
      setAppointmentForm({
        preferredDateTime: '',
        reason: '',
        urgency: 'routine',
      });

      await loadSessions();

      // Show success message (could be improved with a toast notification)
      setError(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSubmittingRequest(false);
    }
  };

  // Join telehealth session
  const handleJoinSession = (session: TelehealthSession) => {
    const now = new Date();
    const sessionTime = new Date(session.scheduledAt);
    const joinWindow = addMinutes(sessionTime, -15); // Can join 15 minutes early
    const endWindow = addMinutes(sessionTime, session.durationMinutes + 15);

    if (isBefore(now, joinWindow)) {
      setError('Session is not yet available. You can join 15 minutes before the scheduled time.');
      return;
    }

    if (isAfter(now, endWindow)) {
      setError('This session has ended.');
      return;
    }

    // Simulate opening telehealth session in new window
    const joinUrl = session.joinUrl || `https://telehealth.ojala.com/join/${session.id}`;
    window.open(joinUrl, '_blank', 'width=1024,height=768');
  };

  // Check if session is eligible for joining
  const isJoinable = (session: TelehealthSession): boolean => {
    if (session.status !== 'Scheduled') return false;

    const now = new Date();
    const sessionTime = new Date(session.scheduledAt);
    const joinWindow = addMinutes(sessionTime, -15);
    const endWindow = addMinutes(sessionTime, session.durationMinutes + 15);

    return isAfter(now, joinWindow) && isBefore(now, endWindow);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Scheduled': return 'primary';
      case 'Completed': return 'success';
      case 'Cancelled': return 'error';
      case 'In Progress': return 'warning';
      default: return 'default';
    }
  };

  // Get urgency color
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'error';
      case 'urgent': return 'warning';
      case 'routine': return 'success';
      default: return 'default';
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  if (loading && sessions.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Telehealth
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress size={50} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading your telehealth sessions...
          </Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <VideoCall sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Telehealth Appointments
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert
            severity={error.includes('Failed to load') ? 'error' : 'warning'}
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Your Virtual Appointments
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Schedule and join telehealth sessions with your healthcare providers.
          </Typography>
        </Box>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <Paper sx={{ p: 6, textAlign: 'center' }}>
            <VideoCall sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Telehealth Sessions
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              You don't have any scheduled telehealth appointments yet.
            </Typography>
            <Button
              variant="contained"
              onClick={() => setRequestDialogOpen(true)}
              startIcon={<Add />}
              size="large"
            >
              Request Appointment
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {sessions.map((session) => (
              <Grid item xs={12} key={session.id}>
                <Card elevation={2}>
                  <CardContent>
                    <Grid container spacing={3} alignItems="center">
                      <Grid item xs={12} md={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                            <Person />
                          </Avatar>
                          <Box>
                            <Typography variant="h6">
                              Session with {session.providerName}
                            </Typography>
                            {session.specialty && (
                              <Typography variant="body2" color="text.secondary">
                                {session.specialty}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <CalendarToday sx={{ mr: 1, fontSize: 16 }} />
                          <Typography variant="body2">
                            {format(new Date(session.scheduledAt), 'MMM dd, yyyy')}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <AccessTime sx={{ mr: 1, fontSize: 16 }} />
                          <Typography variant="body2">
                            {format(new Date(session.scheduledAt), 'h:mm a')} ({session.durationMinutes} min)
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Computer sx={{ mr: 1, fontSize: 16 }} />
                          <Typography variant="body2">Virtual Visit</Typography>
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Reason for visit:
                        </Typography>
                        <Typography variant="body1">{session.reason}</Typography>
                      </Grid>

                      <Grid item xs={12} md={2}>
                        <Chip
                          label={session.status}
                          color={getStatusColor(session.status) as any}
                          variant={session.status === 'Completed' ? 'filled' : 'outlined'}
                        />
                      </Grid>

                      <Grid item xs={12} md={2}>
                        {isJoinable(session) ? (
                          <Button
                            variant="contained"
                            color="success"
                            onClick={() => handleJoinSession(session)}
                            startIcon={<VideoCall />}
                            fullWidth
                          >
                            Join Session
                          </Button>
                        ) : session.status === 'Scheduled' ? (
                          <Button
                            variant="outlined"
                            disabled
                            startIcon={<Schedule />}
                            fullWidth
                          >
                            Scheduled
                          </Button>
                        ) : (
                          <Button
                            variant="outlined"
                            disabled
                            startIcon={<LocalHospital />}
                            fullWidth
                          >
                            {session.status}
                          </Button>
                        )}
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Floating Action Button */}
        <Fab
          color="primary"
          onClick={() => setRequestDialogOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
        >
          <Add />
        </Fab>

        {/* Request Appointment Dialog */}
        <Dialog
          open={requestDialogOpen}
          onClose={() => setRequestDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <VideoCall sx={{ mr: 2 }} />
              Request Telehealth Appointment
            </Box>
          </DialogTitle>

          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="Preferred Date & Time"
                  type="datetime-local"
                  fullWidth
                  value={appointmentForm.preferredDateTime}
                  onChange={(e) => setAppointmentForm(prev => ({
                    ...prev,
                    preferredDateTime: e.target.value
                  }))}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    min: new Date().toISOString().slice(0, 16), // Prevent past dates
                  }}
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Urgency</InputLabel>
                  <Select
                    value={appointmentForm.urgency}
                    label="Urgency"
                    onChange={(e) => setAppointmentForm(prev => ({
                      ...prev,
                      urgency: e.target.value as 'routine' | 'urgent' | 'emergency'
                    }))}
                  >
                    <MenuItem value="routine">Routine</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                    <MenuItem value="emergency">Emergency</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Reason for Visit"
                  multiline
                  rows={4}
                  fullWidth
                  value={appointmentForm.reason}
                  onChange={(e) => setAppointmentForm(prev => ({
                    ...prev,
                    reason: e.target.value
                  }))}
                  placeholder="Please describe your symptoms or the reason for this appointment..."
                />
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 2 }}>
              Your appointment request will be reviewed by our scheduling team. You'll receive a confirmation within 24 hours.
            </Alert>
          </DialogContent>

          <DialogActions>
            <Button
              onClick={() => setRequestDialogOpen(false)}
              disabled={submittingRequest}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestAppointment}
              variant="contained"
              disabled={submittingRequest}
              startIcon={submittingRequest ? <CircularProgress size={20} /> : <Send />}
            >
              Submit Request
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default TelehealthPage;
