import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  Button, 
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Assignment as RecordIcon,
  LocalHospital as MedicationIcon,
  TrendingUp as TrendingUpIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { dashboardApi } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Dashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();
  
  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery(
    'dashboardData', 
    () => dashboardApi.getData().then(res => res.data)
  );
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Healthcare Dashboard
      </Typography>
      
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h5" component="div">
                    {dashboardData?.stats?.totalPatients || 0}
                  </Typography>
                  <Typography variant="body2">
                    Total Patients
                  </Typography>
                </Box>
                <PersonIcon fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h5" component="div">
                    {dashboardData?.stats?.appointmentsToday || 0}
                  </Typography>
                  <Typography variant="body2">
                    Today's Appointments
                  </Typography>
                </Box>
                <CalendarIcon fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'warning.light', color: 'warning.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h5" component="div">
                    {dashboardData?.stats?.pendingRecords || 0}
                  </Typography>
                  <Typography variant="body2">
                    Pending Records
                  </Typography>
                </Box>
                <RecordIcon fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: 'info.light', color: 'info.contrastText' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h5" component="div">
                    {dashboardData?.stats?.activePlans || 0}
                  </Typography>
                  <Typography variant="body2">
                    Active Healthcare Plans
                  </Typography>
                </Box>
                <MedicationIcon fontSize="large" />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} centered>
          <Tab label="Overview" />
          <Tab label="Patients" />
          <Tab label="Appointments" />
        </Tabs>
      </Box>
      
      {/* Tab Panels */}
      <Box>
        {/* Overview Tab */}
        {tabValue === 0 && (
          <Grid container spacing={3}>
            {/* Patients by Age Chart */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Patients by Age Group
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dashboardData?.patientsByAge?.labels.map((label, index) => ({
                        ageGroup: label,
                        count: dashboardData.patientsByAge.data[index]
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="ageGroup" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Patients" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            
            {/* Appointments by Month Chart */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Appointments by Month
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={dashboardData?.appointmentsByMonth?.labels.map((label, index) => ({
                        month: label,
                        count: dashboardData.appointmentsByMonth.data[index]
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" name="Appointments" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            
            {/* Records by Type Chart */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Medical Records by Type
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={dashboardData?.recordsByType?.labels.map((label, index) => ({
                          name: label,
                          value: dashboardData.recordsByType.data[index]
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {dashboardData?.recordsByType?.labels.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
            
            {/* Key Performance Indicators */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom>
                  Key Performance Indicators
                </Typography>
                <Box sx={{ mt: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Patient Satisfaction
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="h4" component="div" sx={{ mr: 1 }}>
                              92%
                            </Typography>
                            <TrendingUpIcon color="success" />
                          </Box>
                          <Typography variant="body2" color="success.main">
                            +5% from last month
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Appointment Completion
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="h4" component="div" sx={{ mr: 1 }}>
                              87%
                            </Typography>
                            <TrendingUpIcon color="success" />
                          </Box>
                          <Typography variant="body2" color="success.main">
                            +3% from last month
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Average Wait Time
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="h4" component="div" sx={{ mr: 1 }}>
                              12m
                            </Typography>
                            <TrendingUpIcon color="error" sx={{ transform: 'rotate(180deg)' }} />
                          </Box>
                          <Typography variant="body2" color="error.main">
                            -2m from last month
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            New Patients
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="h4" component="div" sx={{ mr: 1 }}>
                              24
                            </Typography>
                            <TrendingUpIcon color="success" />
                          </Box>
                          <Typography variant="body2" color="success.main">
                            +8 from last month
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
        
        {/* Patients Tab */}
        {tabValue === 1 && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Recent Patients
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/patients')}
              >
                View All Patients
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Age</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>Healthcare Plan</TableCell>
                    <TableCell>Last Visit</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Sample data - would be replaced with actual data */}
                  {[
                    {
                      id: '1',
                      firstName: 'John',
                      lastName: 'Doe',
                      dateOfBirth: '1985-05-15',
                      gender: 'Male',
                      email: 'john.doe@example.com',
                      phoneNumber: '(555) 123-4567',
                      healthcarePlanName: 'Premium Care',
                      lastVisit: '2025-04-10'
                    },
                    {
                      id: '2',
                      firstName: 'Jane',
                      lastName: 'Smith',
                      dateOfBirth: '1990-08-22',
                      gender: 'Female',
                      email: 'jane.smith@example.com',
                      phoneNumber: '(555) 987-6543',
                      healthcarePlanName: 'Standard Care',
                      lastVisit: '2025-04-15'
                    },
                    {
                      id: '3',
                      firstName: 'Robert',
                      lastName: 'Johnson',
                      dateOfBirth: '1978-11-30',
                      gender: 'Male',
                      email: 'robert.johnson@example.com',
                      phoneNumber: '(555) 456-7890',
                      healthcarePlanName: 'Basic Care',
                      lastVisit: '2025-04-18'
                    },
                    {
                      id: '4',
                      firstName: 'Emily',
                      lastName: 'Williams',
                      dateOfBirth: '1995-03-12',
                      gender: 'Female',
                      email: 'emily.williams@example.com',
                      phoneNumber: '(555) 234-5678',
                      healthcarePlanName: 'Premium Care',
                      lastVisit: '2025-04-20'
                    },
                    {
                      id: '5',
                      firstName: 'Michael',
                      lastName: 'Brown',
                      dateOfBirth: '1982-07-08',
                      gender: 'Male',
                      email: 'michael.brown@example.com',
                      phoneNumber: '(555) 876-5432',
                      healthcarePlanName: 'Standard Care',
                      lastVisit: '2025-04-22'
                    }
                  ].map((patient) => (
                    <TableRow 
                      key={patient.id}
                      hover
                      onClick={() => navigate(`/patients/${patient.id}`)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        {patient.firstName} {patient.lastName}
                      </TableCell>
                      <TableCell>
                        {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()}
                      </TableCell>
                      <TableCell>{patient.gender}</TableCell>
                      <TableCell>
                        {patient.email}<br />
                        {patient.phoneNumber}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={patient.healthcarePlanName} 
                          color={
                            patient.healthcarePlanName === 'Premium Care' ? 'primary' :
                            patient.healthcarePlanName === 'Standard Care' ? 'success' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {format(new Date(patient.lastVisit), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Show options menu
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
        
        {/* Appointments Tab */}
        {tabValue === 2 && (
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Today's Appointments
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                onClick={() => navigate('/appointments')}
              >
                Manage Appointments
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Time</TableCell>
                    <TableCell>Patient</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Provider</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Sample data - would be replaced with actual data */}
                  {[
                    {
                      id: '1',
                      patientName: 'John Doe',
                      startTime: '09:00',
                      endTime: '09:30',
                      type: 'Check-up',
                      status: 'Scheduled',
                      providerName: 'Dr. Smith'
                    },
                    {
                      id: '2',
                      patientName: 'Jane Smith',
                      startTime: '10:00',
                      endTime: '10:30',
                      type: 'Follow-up',
                      status: 'Completed',
                      providerName: 'Dr. Johnson'
                    },
                    {
                      id: '3',
                      patientName: 'Robert Johnson',
                      startTime: '11:00',
                      endTime: '11:30',
                      type: 'Consultation',
                      status: 'Scheduled',
                      providerName: 'Dr. Smith'
                    },
                    {
                      id: '4',
                      patientName: 'Emily Williams',
                      startTime: '13:00',
                      endTime: '13:30',
                      type: 'Vaccination',
                      status: 'Scheduled',
                      providerName: 'Dr. Brown'
                    },
                    {
                      id: '5',
                      patientName: 'Michael Brown',
                      startTime: '14:00',
                      endTime: '14:30',
                      type: 'Lab Work',
                      status: 'Cancelled',
                      providerName: 'Dr. Johnson'
                    }
                  ].map((appointment) => (
                    <TableRow 
                      key={appointment.id}
                      hover
                      onClick={() => navigate(`/appointments/${appointment.id}`)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        {appointment.startTime} - {appointment.endTime}
                      </TableCell>
                      <TableCell>{appointment.patientName}</TableCell>
                      <TableCell>{appointment.type}</TableCell>
                      <TableCell>
                        <Chip 
                          label={appointment.status} 
                          color={
                            appointment.status === 'Scheduled' ? 'primary' :
                            appointment.status === 'Completed' ? 'success' :
                            appointment.status === 'Cancelled' ? 'error' : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{appointment.providerName}</TableCell>
                      <TableCell>
                        <IconButton 
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Show options menu
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

export default Dashboard;
