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
  Snackbar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton
} from '@mui/material';
import { 
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { medicalRecordsApi, patientsApi } from '../services/api';

const MedicalRecords = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [recordForm, setRecordForm] = useState({
    patientId: '',
    recordType: '',
    diagnosis: '',
    treatment: '',
    notes: '',
    prescriptions: []
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [currentPrescription, setCurrentPrescription] = useState({
    medicationName: '',
    dosage: '',
    frequency: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    instructions: ''
  });
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false);
  const [editingPrescriptionIndex, setEditingPrescriptionIndex] = useState(-1);
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Fetch medical records
  const { data: medicalRecords, isLoading: isLoadingRecords } = useQuery(
    ['medicalRecords', selectedPatientId], 
    () => selectedPatientId 
      ? medicalRecordsApi.getByPatientId(selectedPatientId).then(res => res.data)
      : medicalRecordsApi.getAll().then(res => res.data)
  );
  
  // Fetch patients for dropdown
  const { data: patients, isLoading: isLoadingPatients } = useQuery(
    'patients', 
    () => patientsApi.getAll().then(res => res.data)
  );
  
  // Create medical record mutation
  const createRecord = useMutation(
    (recordData) => medicalRecordsApi.create(recordData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['medicalRecords', selectedPatientId]);
        setOpenDialog(false);
        setSnackbar({
          open: true,
          message: 'Medical record created successfully',
          severity: 'success'
        });
      },
      onError: (error) => {
        setSnackbar({
          open: true,
          message: `Error creating medical record: ${error.message}`,
          severity: 'error'
        });
      }
    }
  );
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRecordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle prescription form input change
  const handlePrescriptionInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentPrescription(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle dialog open/close
  const handleOpenDialog = () => {
    setRecordForm({
      patientId: selectedPatientId || '',
      recordType: '',
      diagnosis: '',
      treatment: '',
      notes: '',
      prescriptions: []
    });
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Handle prescription dialog open/close
  const handleOpenPrescriptionDialog = (index = -1) => {
    if (index >= 0) {
      // Editing existing prescription
      setCurrentPrescription(recordForm.prescriptions[index]);
      setEditingPrescriptionIndex(index);
    } else {
      // Adding new prescription
      setCurrentPrescription({
        medicationName: '',
        dosage: '',
        frequency: '',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: '',
        instructions: ''
      });
      setEditingPrescriptionIndex(-1);
    }
    setPrescriptionDialogOpen(true);
  };
  
  const handleClosePrescriptionDialog = () => {
    setPrescriptionDialogOpen(false);
  };
  
  // Handle adding/updating prescription
  const handleSavePrescription = () => {
    if (!currentPrescription.medicationName || !currentPrescription.dosage || !currentPrescription.frequency) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required prescription fields',
        severity: 'error'
      });
      return;
    }
    
    if (editingPrescriptionIndex >= 0) {
      // Update existing prescription
      const updatedPrescriptions = [...recordForm.prescriptions];
      updatedPrescriptions[editingPrescriptionIndex] = currentPrescription;
      setRecordForm(prev => ({
        ...prev,
        prescriptions: updatedPrescriptions
      }));
    } else {
      // Add new prescription
      setRecordForm(prev => ({
        ...prev,
        prescriptions: [...prev.prescriptions, currentPrescription]
      }));
    }
    
    setPrescriptionDialogOpen(false);
  };
  
  // Handle removing prescription
  const handleRemovePrescription = (index) => {
    const updatedPrescriptions = [...recordForm.prescriptions];
    updatedPrescriptions.splice(index, 1);
    setRecordForm(prev => ({
      ...prev,
      prescriptions: updatedPrescriptions
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form
    if (!recordForm.patientId || !recordForm.recordType) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'error'
      });
      return;
    }
    
    // Format data for API
    const formattedData = {
      ...recordForm,
      recordDate: format(new Date(), 'yyyy-MM-dd'),
      providerId: localStorage.getItem('userId') // Use current user as provider
    };
    
    createRecord.mutate(formattedData);
  };
  
  // Handle patient filter change
  const handlePatientFilterChange = (e) => {
    setSelectedPatientId(e.target.value);
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };
  
  // Group records by date
  const groupRecordsByDate = (records) => {
    if (!records || records.length === 0) return [];
    
    const grouped = {};
    
    records.forEach(record => {
      const date = record.recordDate;
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(record);
    });
    
    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => {
        return new Date(dateB) - new Date(dateA); // Sort by date descending
      })
      .map(([date, records]) => ({
        date,
        records
      }));
  };
  
  const groupedRecords = medicalRecords ? groupRecordsByDate(medicalRecords) : [];
  
  if (isLoadingRecords) {
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
          Medical Records
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          New Record
        </Button>
      </Box>
      
      <Grid container spacing={3}>
        {/* Filter Panel */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Filters
            </Typography>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Patient</InputLabel>
              <Select
                value={selectedPatientId}
                onChange={handlePatientFilterChange}
                label="Patient"
              >
                <MenuItem value="">All Patients</MenuItem>
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
            
            <Typography variant="subtitle2" gutterBottom>
              Record Types
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip label="All Types" color="primary" variant="outlined" onClick={() => {}} />
              <Chip label="Check-up" variant="outlined" onClick={() => {}} />
              <Chip label="Diagnosis" variant="outlined" onClick={() => {}} />
              <Chip label="Treatment" variant="outlined" onClick={() => {}} />
              <Chip label="Lab Results" variant="outlined" onClick={() => {}} />
            </Box>
            
            <Typography variant="subtitle2" gutterBottom>
              Date Range
            </Typography>
            <TextField
              label="From"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            <TextField
              label="To"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />
            
            <Button variant="outlined" fullWidth>
              Apply Filters
            </Button>
          </Paper>
        </Grid>
        
        {/* Records List */}
        <Grid item xs={12} md={9}>
          {groupedRecords.length > 0 ? (
            groupedRecords.map((group, groupIndex) => (
              <Paper key={groupIndex} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {format(new Date(group.date), 'EEEE, MMMM d, yyyy')}
                </Typography>
                
                <List>
                  {group.records.map((record) => (
                    <ListItem 
                      key={record.id}
                      alignItems="flex-start"
                      sx={{ 
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        mb: 2,
                        p: 2
                      }}
                      secondaryAction={
                        <IconButton 
                          edge="end" 
                          onClick={() => navigate(`/medical-records/${record.id}`)}
                        >
                          <AssignmentIcon />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle1" component="span">
                              {record.recordType}
                            </Typography>
                            <Chip 
                              label={`Dr. ${record.providerName}`}
                              size="small"
                              sx={{ ml: 2 }}
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span" color="text.primary">
                              Patient: {record.patientName}
                            </Typography>
                            
                            {record.diagnosis && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" component="span" color="text.primary">
                                  Diagnosis:
                                </Typography>
                                <Typography variant="body2" component="p">
                                  {record.diagnosis}
                                </Typography>
                              </Box>
                            )}
                            
                            {record.treatment && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" component="span" color="text.primary">
                                  Treatment:
                                </Typography>
                                <Typography variant="body2" component="p">
                                  {record.treatment}
                                </Typography>
                              </Box>
                            )}
                            
                            {record.prescriptions && record.prescriptions.length > 0 && (
                              <Box sx={{ mt: 1 }}>
                                <Typography variant="body2" component="span" color="text.primary">
                                  Prescriptions:
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                                  {record.prescriptions.map((prescription, index) => (
                                    <Chip 
                                      key={index}
                                      label={`${prescription.medicationName} (${prescription.dosage})`}
                                      size="small"
                                      color="primary"
                                      variant="outlined"
                                    />
                                  ))}
                                </Box>
                              </Box>
                            )}
                          </>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            ))
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No medical records found
              </Typography>
              <Button 
                variant="contained" 
                color="primary" 
                startIcon={<AddIcon />}
                onClick={handleOpenDialog}
                sx={{ mt: 2 }}
              >
                Create New Record
              </Button>
            </Paper>
          )}
        </Grid>
      </Grid>
      
      {/* New Medical Record Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>Create New Medical Record</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Patient</InputLabel>
                  <Select
                    name="patientId"
                    value={recordForm.patientId}
                    onChange={handleInputChange}
                    label="Patient"
                    disabled={!!selectedPatientId}
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
                  <InputLabel>Record Type</InputLabel>
                  <Select
                    name="recordType"
                    value={recordForm.recordType}
                    onChange={handleInputChange}
                    label="Record Type"
                  >
                    <MenuItem value="Check-up">Check-up</MenuItem>
                    <MenuItem value="Diagnosis">Diagnosis</MenuItem>
                    <MenuItem value="Treatment">Treatment</MenuItem>
                    <MenuItem value="Lab Results">Lab Results</MenuItem>
                    <MenuItem value="Vaccination">Vaccination</MenuItem>
                    <MenuItem value="Surgery">Surgery</MenuItem>
                    <MenuItem value="Physical Therapy">Physical Therapy</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="diagnosis"
                  label="Diagnosis"
                  multiline
                  rows={2}
                  fullWidth
                  value={recordForm.diagnosis}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="treatment"
                  label="Treatment"
                  multiline
                  rows={2}
                  fullWidth
                  value={recordForm.treatment}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="notes"
                  label="Notes"
                  multiline
                  rows={3}
                  fullWidth
                  value={recordForm.notes}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1">
                    Prescriptions
                  </Typography>
                  <Button 
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenPrescriptionDialog()}
                    size="small"
                  >
                    Add Prescription
                  </Button>
                </Box>
                
                {recordForm.prescriptions.length > 0 ? (
                  <List>
                    {recordForm.prescriptions.map((prescription, index) => (
                      <ListItem 
                        key={index}
                        secondaryAction={
                          <Box>
                            <IconButton 
                              edge="end" 
                              onClick={() => handleOpenPrescriptionDialog(index)}
                              size="small"
                              sx={{ mr: 1 }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              edge="end" 
                              onClick={() => handleRemovePrescription(index)}
                              size="small"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        }
                        sx={{ 
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          mb: 1
                        }}
                      >
                        <ListItemText
                          primary={prescription.medicationName}
                          secondary={
                            <>
                              <Typography variant="body2" component="span">
                                {prescription.dosage} - {prescription.frequency}
                              </Typography>
                              <Typography variant="body2" component="p">
                                {prescription.instructions}
                              </Typography>
                              <Typography variant="caption" component="p">
                                Start: {prescription.startDate}
                                {prescription.endDate && ` | End: ${prescription.endDate}`}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                    No prescriptions added
                  </Typography>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary"
              disabled={createRecord.isLoading}
            >
              {createRecord.isLoading ? <CircularProgress size={24} /> : 'Save Record'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      
      {/* Prescription Dialog */}
      <Dialog open={prescriptionDialogOpen} onClose={handleClosePrescriptionDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPrescriptionIndex >= 0 ? 'Edit Prescription' : 'Add Prescription'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                name="medicationName"
                label="Medication Name"
                fullWidth
                required
                value={currentPrescription.medicationName}
                onChange={handlePrescriptionInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="dosage"
                label="Dosage"
                fullWidth
                required
                value={currentPrescription.dosage}
                onChange={handlePrescriptionInputChange}
                placeholder="e.g., 500mg"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="frequency"
                label="Frequency"
                fullWidth
                required
                value={currentPrescription.frequency}
                onChange={handlePrescriptionInputChange}
                placeholder="e.g., Twice daily"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="startDate"
                label="Start Date"
                type="date"
                fullWidth
                required
                value={currentPrescription.startDate}
                onChange={handlePrescriptionInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="endDate"
                label="End Date"
                type="date"
                fullWidth
                value={currentPrescription.endDate}
                onChange={handlePrescriptionInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="instructions"
                label="Instructions"
                multiline
                rows={2}
                fullWidth
                value={currentPrescription.instructions}
                onChange={handlePrescriptionInputChange}
                placeholder="e.g., Take with food"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePrescriptionDialog}>Cancel</Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSavePrescription}
            startIcon={<SaveIcon />}
          >
            Save
          </Button>
        </DialogActions>
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

export default MedicalRecords;
