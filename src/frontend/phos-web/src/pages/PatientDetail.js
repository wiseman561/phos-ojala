import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  CardHeader, 
  Button, 
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Avatar,
  CircularProgress,
  IconButton
} from '@mui/material';
import { 
  CalendarToday as CalendarIcon,
  Assignment as RecordIcon,
  LocalHospital as MedicationIcon,
  Edit as EditIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { format } from 'date-fns';
import { patientsApi, medicalRecordsApi, appointmentsApi } from '../services/api';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Fetch patient data
  const { data: patient, isLoading: isLoadingPatient } = useQuery(
    ['patient', id], 
    () => patientsApi.getById(id).then(res => res.data)
  );
  
  // Fetch patient medical history
  const { data: medicalHistory, isLoading: isLoadingHistory } = useQuery(
    ['medicalHistory', id], 
    () => patientsApi.getMedicalHistory(id).then(res => res.data)
  );
  
  // Calculate age
  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  if (isLoadingPatient || isLoadingHistory) {
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
          Patient Details
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<EditIcon />}
          onClick={() => navigate(`/patients/edit/${id}`)}
        >
          Edit Patient
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {/* Patient Information */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar 
                sx={{ width: 80, height: 80, mr: 2, bgcolor: 'primary.main' }}
              >
                {patient?.firstName?.[0]}{patient?.lastName?.[0]}
              </Avatar>
              <Box>
                <Typography variant="h5" component="h2">
                  {patient?.firstName} {patient?.lastName}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {calculateAge(patient?.dateOfBirth)} years old
                </Typography>
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Date of Birth
                </Typography>
                <Typography variant="body1">
                  {format(new Date(patient?.dateOfBirth), 'MMM d, yyyy')}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Gender
                </Typography>
                <Typography variant="body1">
                  {patient?.gender}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {patient?.email}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Phone
                </Typography>
                <Typography variant="body1">
                  {patient?.phoneNumber}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Address
                </Typography>
                <Typography variant="body1">
                  {patient?.address}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Blood Type
                </Typography>
                <Typography variant="body1">
                  {patient?.bloodType || 'Not recorded'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Primary Provider
                </Typography>
                <Typography variant="body1">
                  {patient?.primaryProviderName || 'Not assigned'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Healthcare Plan
                </Typography>
                <Typography variant="body1">
                  {patient?.healthcarePlanName || 'None'}
                </Typography>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>
              Emergency Contact
            </Typography>
            <Typography variant="body1">
              {patient?.emergencyContactName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {patient?.emergencyContactPhone}
            </Typography>
          </Paper>
        </Grid>
        
        {/* Medical Information */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={3}>
            {/* Allergies & Conditions */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Allergies & Chronic Conditions
                  </Typography>
                  <IconButton 
                    color="primary"
                    onClick={() => navigate(`/patients/${id}/medical-info/edit`)}
                  >
                    <EditIcon />
                  </IconButton>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Allergies
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {patient?.allergies?.length > 0 ? (
                        patient.allergies.map((allergy, index) => (
                          <Chip 
                            key={index} 
                            label={allergy} 
                            color="error" 
                            variant="outlined" 
                          />
                        ))
                      ) : (
                        <Typography variant="body2">No known allergies</Typography>
                      )}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Chronic Conditions
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {patient?.chronicConditions?.length > 0 ? (
                        patient.chronicConditions.map((condition, index) => (
                          <Chip 
                            key={index} 
                            label={condition} 
                            color="primary" 
                            variant="outlined" 
                          />
                        ))
                      ) : (
                        <Typography variant="body2">No chronic conditions</Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            {/* Upcoming Appointments */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Upcoming Appointments
                  </Typography>
                  <Button 
                    startIcon={<AddIcon />}
                    onClick={() => navigate(`/appointments/new?patientId=${id}`)}
                  >
                    Schedule
                  </Button>
                </Box>
                
                {medicalHistory?.appointments?.length > 0 ? (
                  <List>
                    {medicalHistory.appointments
                      .filter(appointment => new Date(appointment.appointmentDate) >= new Date())
                      .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
                      .slice(0, 3)
                      .map((appointment) => (
                        <ListItem 
                          key={appointment.id}
                          secondaryAction={
                            <IconButton 
                              edge="end" 
                              onClick={() => navigate(`/appointments/${appointment.id}`)}
                            >
                              <CalendarIcon />
                            </IconButton>
                          }
                          sx={{ 
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 1
                          }}
                        >
                          <ListItemText
                            primary={appointment.type}
                            secondary={
                              <>
                                <Typography variant="body2" component="span">
                                  {format(new Date(appointment.appointmentDate), 'MMM d, yyyy')}
                                </Typography>
                                <Typography variant="body2" component="span" sx={{ ml: 2 }}>
                                  {appointment.startTime} - {appointment.endTime}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No upcoming appointments
                  </Typography>
                )}
                
                <Button 
                  variant="text" 
                  fullWidth 
                  onClick={() => navigate(`/appointments?patientId=${id}`)}
                  sx={{ mt: 2 }}
                >
                  View All Appointments
                </Button>
              </Paper>
            </Grid>
            
            {/* Recent Medical Records */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Recent Medical Records
                  </Typography>
                  <Button 
                    startIcon={<AddIcon />}
                    onClick={() => navigate(`/medical-records/new?patientId=${id}`)}
                  >
                    Add Record
                  </Button>
                </Box>
                
                {medicalHistory?.medicalRecords?.length > 0 ? (
                  <List>
                    {medicalHistory.medicalRecords
                      .sort((a, b) => new Date(b.recordDate) - new Date(a.recordDate))
                      .slice(0, 3)
                      .map((record) => (
                        <ListItem 
                          key={record.id}
                          secondaryAction={
                            <IconButton 
                              edge="end" 
                              onClick={() => navigate(`/medical-records/${record.id}`)}
                            >
                              <RecordIcon />
                            </IconButton>
                          }
                          sx={{ 
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 1,
                            mb: 1
                          }}
                        >
                          <ListItemText
                            primary={record.recordType}
                            secondary={
                              <>
                                <Typography variant="body2" component="span">
                                  {format(new Date(record.recordDate), 'MMM d, yyyy')}
                                </Typography>
                                <Typography variant="body2" component="span" sx={{ ml: 2 }}>
                                  Dr. {record.providerName}
                                </Typography>
                              </>
                            }
                          />
                        </ListItem>
                      ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No medical records
                  </Typography>
                )}
                
                <Button 
                  variant="text" 
                  fullWidth 
                  onClick={() => navigate(`/medical-records?patientId=${id}`)}
                  sx={{ mt: 2 }}
                >
                  View All Records
                </Button>
              </Paper>
            </Grid>
            
            {/* Current Medications */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Current Medications
                </Typography>
                
                {medicalHistory?.prescriptions?.length > 0 ? (
                  <Grid container spacing={2}>
                    {medicalHistory.prescriptions
                      .filter(prescription => !prescription.endDate || new Date(prescription.endDate) >= new Date())
                      .map((prescription) => (
                        <Grid item xs={12} sm={6} md={4} key={prescription.id}>
                          <Card variant="outlined">
                            <CardContent>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <MedicationIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="subtitle1">
                                  {prescription.medicationName}
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {prescription.dosage} - {prescription.frequency}
                              </Typography>
                              <Typography variant="body2">
                                {prescription.instructions}
                              </Typography>
                              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                Started: {format(new Date(prescription.startDate), 'MMM d, yyyy')}
                              </Typography>
                              {prescription.endDate && (
                                <Typography variant="caption" display="block">
                                  Until: {format(new Date(prescription.endDate), 'MMM d, yyyy')}
                                </Typography>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                  </Grid>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No current medications
                  </Typography>
                )}
              </Paper>
            </Grid>
            
            {/* Vital Signs */}
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Recent Vital Signs
                  </Typography>
                  <Button 
                    startIcon={<AddIcon />}
                    onClick={() => navigate(`/patients/${id}/vitals/new`)}
                  >
                    Record Vitals
                  </Button>
                </Box>
                
                {medicalHistory?.vitalSigns?.length > 0 ? (
                  <Box sx={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>Date</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>BP</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>Heart Rate</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>Temp</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>Weight</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>Height</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>BMI</th>
                          <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>O2 Sat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medicalHistory.vitalSigns
                          .sort((a, b) => new Date(b.recordedDate) - new Date(a.recordedDate))
                          .slice(0, 5)
                          .map((vitals) => (
                            <tr key={vitals.id}>
                              <td style={{ padding: '8px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
                                {format(new Date(vitals.recordedDate), 'MMM d, yyyy')}
                              </td>
                              <td style={{ padding: '8px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
                                {vitals.bloodPressureSystolic}/{vitals.bloodPressureDiastolic}
                              </td>
                              <td style={{ padding: '8px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
                                {vitals.heartRate} bpm
                              </td>
                              <td style={{ padding: '8px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
                                {vitals.temperature}°F
                              </td>
                              <td style={{ padding: '8px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
                                {vitals.weight} lbs
                              </td>
                              <td style={{ padding: '8px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
                                {vitals.height} in
                              </td>
                              <td style={{ padding: '8px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
                                {vitals.bmi}
                              </td>
                              <td style={{ padding: '8px', borderBottom: '1px solid rgba(224, 224, 224, 1)' }}>
                                {vitals.oxygenSaturation}%
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No vital signs recorded
                  </Typography>
                )}
                
                <Button 
                  variant="text" 
                  fullWidth 
                  onClick={() => navigate(`/patients/${id}/vitals`)}
                  sx={{ mt: 2 }}
                >
                  View All Vital Signs
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PatientDetail;
