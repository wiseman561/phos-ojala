import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addMinutes, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { appointmentsApi, patientsApi } from '../services/api';

const Appointments = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openDialog, setOpenDialog] = useState(false);
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: '',
    providerId: '',
    appointmentDate: new Date(),
    startTime: new Date(),
    endTime: new Date(new Date().setMinutes(new Date().getMinutes() + 30)),
    type: '',
    notes: '',
    status: 'Scheduled'
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Fetch appointments for selected date
  const { data: appointments, isLoading: isLoadingAppointments } = useQuery(
    ['appointments', format(selectedDate, 'yyyy-MM-dd')], 
    () => appointmentsApi.getByDate(format(selectedDate, 'yyyy-MM-dd')).then(res => res.data),
    {
      enabled: !!selectedDate
    }
  );
  
  // Fetch patients for dropdown
  const { data: patients, isLoading: isLoadingPatients } = useQuery(
    'patients', 
    () => patientsApi.getAll().then(res => res.data)
  );
  
  // Create appointment mutation
  const createAppointment = useMutation(
    (appointmentData) => appointmentsApi.create(appointmentData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['appointments', format(selectedDate, 'yyyy-MM-dd')]);
        setOpenDialog(false);
        setSnackbar({
          open: true,
          message: 'Appointment created successfully',
          severity: 'success'
        });
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: `Error creating appointment: ${error.message}`,
          severity: 'error'
        });
      }
    }
  );
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAppointmentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle date/time picker changes
  const handleDateChange = (date) => {
    setAppointmentForm(prev => ({
      ...prev,
      appointmentDate: date
    }));
  };
  
  const handleStartTimeChange = (time) => {
    setAppointmentForm(prev => ({
      ...prev,
      startTime: time,
      endTime: addMinutes(time, 30)
    }));
  };
  
  const handleEndTimeChange = (time) => {
    setAppointmentForm(prev => ({
      ...prev,
      endTime: time
    }));
  };
  
  // Handle dialog open/close
  const handleOpenDialog = () => {
    setAppointmentForm({
      patientId: '',
      providerId: '',
      appointmentDate: selectedDate,
      startTime: new Date(),
      endTime: addMinutes(new Date(), 30),
      type: '',
      notes: '',
      status: 'Scheduled'
    });
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!appointmentForm.patientId || !appointmentForm.type) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }
    
    // Validate times
    if (isAfter(appointmentForm.startTime, appointmentForm.endTime)) {
      setSnackbar({
        open: true,
        message: 'Start time must be before end time',
        severity: 'error'
      });
      return;
    }
    
    // Format data for API
    const formattedData = {
      ...appointmentForm,
      appointmentDate: format(appointmentForm.appointmentDate, 'yyyy-MM-dd'),
      startTime: format(appointmentForm.startTime, 'HH:mm'),
      endTime: format(appointmentForm.endTime, 'HH:mm'),
      providerId: appointmentForm.providerId || localStorage.getItem('userId') // Use current user as provider if not specified
    };
    
    createAppointment.mutate(formattedData);
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };
  
  // Group appointments by time slot
  const groupAppointmentsByTime = (appointments) => {
    if (!appointments || appointments.length === 0) return [];
    
    const timeSlots = {};
    
    appointments.forEach(appointment => {
      const startTime = appointment.startTime;
      if (!timeSlots[startTime]) {
        timeSlots[startTime] = [];
      }
      timeSlots[startTime].push(appointment);
    });
    
    return Object.entries(timeSlots)
      .sort(([timeA], [timeB]) => {
        return timeA.localeCompare(timeB);
      })
      .map(([time, appointments]) => ({
        time,
        appointments
      }));
  };
  
  const groupedAppointments = appointments ? groupAppointmentsByTime(appointments) : [];
  
  // Get appointment status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'Scheduled':
        return 'primary.main';
      case 'Completed':
        return 'success.main';
      case 'Cancelled':
        return 'error.main';
      case 'No-Show':
        return 'warning.main';
      default:
        return 'text.primary';
    }
  };
  
  if (isLoadingAppointments) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Appointments
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleOpenDialog}
        >
          New Appointment
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {/* Date Selector */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Date
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                value={selectedDate}
                onChange={(newDate) => setSelectedDate(newDate)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Appointment Summary
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Total Appointments:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {appointments?.length || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Completed:</Typography>
                <Typography variant="body2" fontWeight="bold" color="success.main">
                  {appointments?.filter(a => a.status === 'Completed').length || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Scheduled:</Typography>
                <Typography variant="body2" fontWeight="bold" color="primary.main">
                  {appointments?.filter(a => a.status === 'Scheduled').length || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Cancelled:</Typography>
                <Typography variant="body2" fontWeight="bold" color="error.main">
                  {appointments?.filter(a => a.status === 'Cancelled').length || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2">No-Show:</Typography>
                <Typography variant="body2" fontWeight="bold" color="warning.main">
                  {appointments?.filter(a => a.status === 'No-Show').length || 0}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Appointments Schedule */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Schedule for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </Typography>
            
            {groupedAppointments.length > 0 ? (
              groupedAppointments.map((timeSlot, index) => (
                <Box key={index} sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {timeSlot.time}
                  </Typography>
                  <Grid container spacing={2}>
                    {timeSlot.appointments.map((appointment) => (
                      <Grid item xs={12} sm={6} md={4} key={appointment.id}>
                        <Card 
                          variant="outlined" 
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': {
                              boxShadow: 3
                            },
                            borderLeft: '4px solid',
                            borderLeftColor: getStatusColor(appointment.status)
                          }}
                          onClick={() => navigate(`/appointments/${appointment.id}`)}
                        >
                          <CardContent>
                            <Typography variant="subtitle1" gutterBottom>
                              {appointment.patientName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {appointment.type}
                            </Typography>
                            <Typography variant="body2">
                              {appointment.startTime} - {appointment.endTime}
                            </Typography>
                            <Box 
                              sx={{ 
                                display: 'inline-block', 
                                px: 1, 
                                py: 0.5, 
                                mt: 1,
                                borderRadius: 1,
                                bgcolor: `${getStatusColor(appointment.status)}20`,
                                color: getStatusColor(appointment.status)
                              }}
                            >
                              <Typography variant="caption">
                                {appointment.status}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))
            ) : (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <Typography variant="body1" color="text.secondary">
                  No appointments scheduled for this date
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  sx={{ mt: 2 }}
                  onClick={handleOpenDialog}
                >
                  Schedule Appointment
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* New Appointment Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Schedule New Appointment</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Patient</InputLabel>
                  <Select
                    name="patientId"
                    value={appointmentForm.patientId}
                    onChange={handleInputChange}
                    label="Patient"
                  >
                    {isLoadingPatients ? (
                      <MenuItem disabled>Loading patients...</MenuItem>
                    ) : (
                      patients?.map((patient) => (
                        <MenuItem key={patient.id} value={patient.id}>
                          {patient.firstName} {patient.lastName}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Appointment Type</InputLabel>
                  <Select
                    name="type"
                    value={appointmentForm.type}
                    onChange={handleInputChange}
                    label="Appointment Type"
                  >
                    <MenuItem value="Check-up">Check-up</MenuItem>
                    <MenuItem value="Follow-up">Follow-up</MenuItem>
                    <MenuItem value="Consultation">Consultation</MenuItem>
                    <MenuItem value="Procedure">Procedure</MenuItem>
                    <MenuItem value="Vaccination">Vaccination</MenuItem>
                    <MenuItem value="Lab Work">Lab Work</MenuItem>
                    <MenuItem value="Physical Therapy">Physical Therapy</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Date"
                    value={appointmentForm.appointmentDate}
                    onChange={handleDateChange}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                    minDate={new Date()}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <TimePicker
                    label="Start Time"
                    value={appointmentForm.startTime}
                    onChange={handleStartTimeChange}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <TimePicker
                    label="End Time"
                    value={appointmentForm.endTime}
                    onChange={handleEndTimeChange}
                    renderInput={(params) => <TextField {...params} fullWidth required />}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Notes"
                  multiline
                  rows={4}
                  fullWidth
                  value={appointmentForm.notes}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={createAppointment.isLoading}
            >
              {createAppointment.isLoading ? <CircularProgress size={24} /> : 'Schedule'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Appointments;
