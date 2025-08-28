import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Patients = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    emergencyContactName: '',
    emergencyContactPhone: ''
  });
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Fetch patients data
  const { data: patientsData, isLoading } = useQuery('patients', async () => {
    const response = await axios.get('/api/patients');
    return response.data;
  });
  
  // Create patient mutation
  const createPatient = useMutation(
    (newPatient) => axios.post('/api/patients', newPatient),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('patients');
        handleCloseDialog();
      }
    }
  );
  
  // Update patient mutation
  const updatePatient = useMutation(
    (updatedPatient) => axios.put(`/api/patients/${updatedPatient.id}`, updatedPatient),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('patients');
        handleCloseDialog();
      }
    }
  );
  
  // Delete patient mutation
  const deletePatient = useMutation(
    (id) => axios.delete(`/api/patients/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('patients');
      }
    }
  );
  
  // Mock data for development
  const mockPatients = Array.from({ length: 50 }, (_, i) => ({
    id: `p-${i + 1}`,
    firstName: `First${i + 1}`,
    lastName: `Last${i + 1}`,
    email: `patient${i + 1}@example.com`,
    phoneNumber: `(555) 123-${4000 + i}`,
    dateOfBirth: new Date(1970 + Math.floor(i / 2), i % 12, (i % 28) + 1).toISOString().split('T')[0],
    gender: i % 2 === 0 ? 'Male' : 'Female',
    address: `${1000 + i} Main St, City, State`,
    emergencyContactName: `Emergency Contact ${i + 1}`,
    emergencyContactPhone: `(555) 987-${3000 + i}`
  }));
  
  // Use mock data if API data is not available
  const patients = patientsData || mockPatients;
  
  // Filter patients based on search term
  const filteredPatients = patients.filter(patient => 
    patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phoneNumber.includes(searchTerm)
  );
  
  // Handle page change
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle dialog open for adding new patient
  const handleAddPatient = () => {
    setCurrentPatient(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: ''
    });
    setOpenDialog(true);
  };
  
  // Handle dialog open for editing patient
  const handleEditPatient = (patient) => {
    setCurrentPatient(patient);
    setFormData({
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phoneNumber: patient.phoneNumber,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      address: patient.address,
      emergencyContactName: patient.emergencyContactName,
      emergencyContactPhone: patient.emergencyContactPhone
    });
    setOpenDialog(true);
  };
  
  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };
  
  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (currentPatient) {
      updatePatient.mutate(formData);
    } else {
      createPatient.mutate(formData);
    }
  };
  
  // Handle patient delete
  const handleDeletePatient = (id) => {
    if (window.confirm('Are you sure you want to delete this patient?')) {
      deletePatient.mutate(id);
    }
  };
  
  // Handle view patient details
  const handleViewPatient = (id) => {
    navigate(`/patients/${id}`);
  };
  
  // Calculate age from date of birth
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
  
  if (isLoading) {
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
          Patients
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleAddPatient}
        >
          Add Patient
        </Button>
      </Box>
      
      <Paper sx={{ mb: 3, p: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search patients by name, email, or phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Gender</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPatients
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell>
                    {patient.firstName} {patient.lastName}
                  </TableCell>
                  <TableCell>{calculateAge(patient.dateOfBirth)}</TableCell>
                  <TableCell>{patient.gender}</TableCell>
                  <TableCell>{patient.email}</TableCell>
                  <TableCell>{patient.phoneNumber}</TableCell>
                  <TableCell align="right">
                    <IconButton 
                      color="primary" 
                      onClick={() => handleViewPatient(patient.id)}
                      title="View details"
                    >
                      <ViewIcon />
                    </IconButton>
                    <IconButton 
                      color="secondary" 
                      onClick={() => handleEditPatient(patient)}
                      title="Edit patient"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      color="error" 
                      onClick={() => handleDeletePatient(patient.id)}
                      title="Delete patient"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredPatients.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>
      
      {/* Add/Edit Patient Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {currentPatient ? 'Edit Patient' : 'Add New Patient'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="firstName"
                  label="First Name"
                  fullWidth
                  required
                  value={formData.firstName}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="lastName"
                  label="Last Name"
                  fullWidth
                  required
                  value={formData.lastName}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="email"
                  label="Email"
                  type="email"
                  fullWidth
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="phoneNumber"
                  label="Phone Number"
                  fullWidth
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="dateOfBirth"
                  label="Date of Birth"
                  type="date"
                  fullWidth
                  required
                  InputLabelProps={{ shrink: true }}
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="gender"
                  label="Gender"
                  select
                  fullWidth
                  SelectProps={{ native: true }}
                  value={formData.gender}
                  onChange={handleInputChange}
                >
                  <option value=""></option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  name="address"
                  label="Address"
                  fullWidth
                  multiline
                  rows={2}
                  value={formData.address}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="emergencyContactName"
                  label="Emergency Contact Name"
                  fullWidth
                  value={formData.emergencyContactName}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="emergencyContactPhone"
                  label="Emergency Contact Phone"
                  fullWidth
                  value={formData.emergencyContactPhone}
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
              disabled={createPatient.isLoading || updatePatient.isLoading}
            >
              {(createPatient.isLoading || updatePatient.isLoading) ? (
                <CircularProgress size={24} />
              ) : (
                currentPatient ? 'Update' : 'Add'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Patients;
