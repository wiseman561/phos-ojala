import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Tooltip,
  IconButton,
  Button,
  TextField,
  MenuItem,
  InputAdornment
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import theme from './theme';
import PatientCard from './components/patient-list/PatientCard';
import AlertCard from './components/alerts/AlertCard';
import HealthScoreCard from './components/health-score/HealthScoreCard';
import SecureMessagingPanel from './components/messaging/SecureMessagingPanel';
import TelehealthSchedulingPanel from './components/telehealth/TelehealthSchedulingPanel';

/**
 * RNDashboardScreen Component
 *
 * Main dashboard screen for the RN clinical dashboard that displays
 * patient list, alerts, health scores, and communication tools.
 */
const RNDashboardScreen = () => {
  // State for dashboard configuration
  const [view, setView] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('healthScore');
  const [filterBy, setFilterBy] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Mock data (in a real app, this would come from API/Redux)
  const [patients, setPatients] = useState([
    {
      id: 'patient1',
      firstName: 'John',
      lastName: 'Doe',
      patientId: 'P10045',
      gender: 'Male',
      dateOfBirth: '1975-05-15',
      profileImage: '',
      conditions: ['Hypertension', 'Type 2 Diabetes'],
      careProgram: 'Chronic Care',
      riskLevel: 'Moderate',
      healthScore: {
        current: 72,
        trend: -3,
        lastUpdated: '2025-04-19T10:30:00Z'
      },
      alerts: [
        {
          id: 'alert1',
          title: 'Elevated Blood Pressure',
          description: 'Blood pressure reading of 145/95 recorded this morning.',
          severity: 'warning',
          timestamp: '2025-04-20T08:15:00Z'
        }
      ],
      medicationAdherence: 85
    },
    {
      id: 'patient2',
      firstName: 'Jane',
      lastName: 'Smith',
      patientId: 'P10046',
      gender: 'Female',
      dateOfBirth: '1982-11-23',
      profileImage: '',
      conditions: ['Asthma', 'Anxiety'],
      careProgram: 'Respiratory Care',
      riskLevel: 'Low',
      healthScore: {
        current: 88,
        trend: 2,
        lastUpdated: '2025-04-19T14:45:00Z'
      },
      alerts: [],
      medicationAdherence: 92
    },
    {
      id: 'patient3',
      firstName: 'Robert',
      lastName: 'Johnson',
      patientId: 'P10047',
      gender: 'Male',
      dateOfBirth: '1968-03-10',
      profileImage: '',
      conditions: ['Coronary Artery Disease', 'Hyperlipidemia', 'Hypertension'],
      careProgram: 'Cardiac Care',
      riskLevel: 'High',
      healthScore: {
        current: 58,
        trend: -5,
        lastUpdated: '2025-04-20T09:10:00Z'
      },
      alerts: [
        {
          id: 'alert2',
          title: 'Missed Medication',
          description: 'Patient has missed Lisinopril for 3 consecutive days.',
          severity: 'critical',
          timestamp: '2025-04-20T06:30:00Z'
        },
        {
          id: 'alert3',
          title: 'Abnormal Heart Rate',
          description: 'Resting heart rate of 110 bpm recorded.',
          severity: 'urgent',
          timestamp: '2025-04-20T07:45:00Z'
        }
      ],
      medicationAdherence: 65
    }
  ]);

  // Mock alerts data (in a real app, this would come from API/Redux)
  const [alerts, setAlerts] = useState([
    {
      id: 'alert1',
      title: 'Elevated Blood Pressure',
      description: 'Blood pressure reading of 145/95 recorded this morning.',
      severity: 'warning',
      timestamp: '2025-04-20T08:15:00Z',
      status: 'new',
      actionRequired: true,
      patient: {
        id: 'patient1',
        firstName: 'John',
        lastName: 'Doe',
        patientId: 'P10045',
        age: 50,
        gender: 'Male',
        riskLevel: 'Moderate',
        conditions: ['Hypertension', 'Type 2 Diabetes']
      },
      vitalType: 'blood_pressure',
      value: '145/95',
      unit: 'mmHg',
      percentChange: 12,
      normalRange: {
        min: '90/60',
        max: '130/85'
      }
    },
    {
      id: 'alert2',
      title: 'Missed Medication',
      description: 'Patient has missed Lisinopril for 3 consecutive days.',
      severity: 'critical',
      timestamp: '2025-04-20T06:30:00Z',
      status: 'new',
      actionRequired: true,
      patient: {
        id: 'patient3',
        firstName: 'Robert',
        lastName: 'Johnson',
        patientId: 'P10047',
        age: 57,
        gender: 'Male',
        riskLevel: 'High',
        conditions: ['Coronary Artery Disease', 'Hyperlipidemia', 'Hypertension']
      },
      vitalType: 'medication',
      escalation: {
        autoEscalateAfter: 120 // minutes
      }
    },
    {
      id: 'alert3',
      title: 'Abnormal Heart Rate',
      description: 'Resting heart rate of 110 bpm recorded.',
      severity: 'urgent',
      timestamp: '2025-04-20T07:45:00Z',
      status: 'in_progress',
      actionRequired: true,
      patient: {
        id: 'patient3',
        firstName: 'Robert',
        lastName: 'Johnson',
        patientId: 'P10047',
        age: 57,
        gender: 'Male',
        riskLevel: 'High',
        conditions: ['Coronary Artery Disease', 'Hyperlipidemia', 'Hypertension']
      },
      vitalType: 'heart_rate',
      value: 110,
      unit: 'bpm',
      percentChange: 38,
      normalRange: {
        min: 60,
        max: 100
      },
      assignedTo: {
        id: 'nurse1',
        name: 'Sarah Johnson, RN'
      }
    }
  ]);

  // Mock health score data for selected patient
  const selectedPatientHealthScore = {
    overallScore: selectedPatient ? selectedPatient.healthScore.current : 0,
    timestamp: selectedPatient ? selectedPatient.healthScore.lastUpdated : '',
    trend: selectedPatient ? selectedPatient.healthScore.trend : 0,
    riskLevel: selectedPatient ? selectedPatient.riskLevel.toLowerCase() : 'unknown',
    categoryScores: {
      cardiovascular: {
        score: 65,
        riskLevel: 'moderate',
        trend: 'declining'
      },
      metabolic: {
        score: 78,
        riskLevel: 'low',
        trend: 'stable'
      },
      respiratory: {
        score: 82,
        riskLevel: 'low',
        trend: 'improving'
      },
      lifestyle: {
        score: 70,
        riskLevel: 'moderate',
        trend: 'stable'
      }
    },
    anomalies: [
      {
        vitalType: 'Blood Pressure',
        value: '145/95 mmHg',
        expectedRange: {
          min: '90/60',
          max: '130/85'
        },
        description: 'Consistently elevated blood pressure readings over the past week.'
      },
      {
        vitalType: 'Resting Heart Rate',
        value: '88 bpm',
        expectedRange: {
          min: 60,
          max: 80
        },
        description: 'Resting heart rate has been trending upward for the past 10 days.'
      }
    ],
    recommendations: [
      {
        description: 'Schedule follow-up appointment to reassess medication efficacy',
        priority: 'high'
      },
      {
        description: 'Review sodium intake and dietary habits',
        priority: 'medium'
      },
      {
        description: 'Encourage daily blood pressure monitoring',
        priority: 'medium'
      }
    ],
    aiExplanation: 'This patient\'s health score has decreased by 3 points primarily due to consistently elevated blood pressure readings and reduced medication adherence. The cardiovascular category shows the most significant decline, while other categories remain relatively stable. Recent lifestyle changes, including reduced physical activity and increased stress levels reported in the patient\'s daily check-ins, may be contributing factors.'
  };

  // Mock messages data for selected patient
  const [messages, setMessages] = useState([
    {
      id: 'msg1',
      content: 'Good morning Dr. Johnson, I\'ve been experiencing some dizziness when standing up quickly. Should I be concerned?',
      timestamp: '2025-04-19T09:30:00Z',
      senderType: 'patient',
      sender: {
        id: 'patient1',
        name: 'John Doe'
      },
      status: 'read'
    },
    {
      id: 'msg2',
      content: 'Hello John, this could be related to your blood pressure medication. Have you been taking it regularly? Also, are you staying hydrated throughout the day?',
      timestamp: '2025-04-19T10:15:00Z',
      senderType: 'clinician',
      sender: {
        id: 'nurse1',
        name: 'Sarah Johnson, RN'
      },
      status: 'read'
    },
    {
      id: 'msg3',
      content: 'I\'ve been taking my medication as prescribed, but I might not be drinking enough water. I\'ll try to increase my water intake and see if that helps.',
      timestamp: '2025-04-19T10:45:00Z',
      senderType: 'patient',
      sender: {
        id: 'patient1',
        name: 'John Doe'
      },
      status: 'read'
    },
    {
      id: 'msg4',
      content: 'That\'s a good plan. Please monitor your symptoms and let me know if the dizziness persists or worsens. Also, I\'ve attached some information about orthostatic hypotension, which is the medical term for this type of dizziness.',
      timestamp: '2025-04-19T11:00:00Z',
      senderType: 'clinician',
      sender: {
        id: 'nurse1',
        name: 'Sarah Johnson, RN'
      },
      attachments: [
        {
          id: 'attach1',
          name: 'Orthostatic_Hypotension_Info.pdf',
          type: 'application/pdf'
        }
      ],
      status: 'delivered'
    }
  ]);

  // Mock appointments data
  const [appointments, setAppointments] = useState([
    {
      id: 'appt1',
      patient: {
        id: 'patient1',
        firstName: 'John',
        lastName: 'Doe',
        patientId: 'P10045'
      },
      startTime: '2025-04-20T14:00:00Z',
      endTime: '2025-04-20T14:30:00Z',
      status: 'confirmed',
      appointmentType: 'Follow-up',
      reason: 'Blood pressure check',
      urgency: 'normal'
    },
    {
      id: 'appt2',
      patient: {
        id: 'patient3',
        firstName: 'Robert',
        lastName: 'Johnson',
        patientId: 'P10047'
      },
      startTime: '2025-04-20T15:30:00Z',
      endTime: '2025-04-20T16:00:00Z',
      status: 'confirmed',
      appointmentType: 'Urgent Care',
      reason: 'Chest discomfort evaluation',
      urgency: 'urgent'
    },
    {
      id: 'appt3',
      patient: {
        id: 'patient2',
        firstName: 'Jane',
        lastName: 'Smith',
        patientId: 'P10046'
      },
      startTime: '2025-04-21T10:00:00Z',
      endTime: '2025-04-21T10:30:00Z',
      status: 'confirmed',
      appointmentType: 'Medication Review',
      reason: 'Asthma medication adjustment',
      urgency: 'normal'
    }
  ]);

  // Filter patients based on search query and filters
  const filteredPatients = patients.filter(patient => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const fullName = `${patient.firstName} ${patient.lastName}`.toLowerCase();
      if (!fullName.includes(query) && !patient.patientId.toLowerCase().includes(query)) {
        return false;
      }
    }

    // Risk level filter
    if (filterBy !== 'all') {
      if (filterBy === 'high' && patient.riskLevel !== 'High') {
        return false;
      } else if (filterBy === 'moderate' && patient.riskLevel !== 'Moderate') {
        return false;
      } else if (filterBy === 'low' && patient.riskLevel !== 'Low') {
        return false;
      } else if (filterBy === 'alerts' && patient.alerts.length === 0) {
        return false;
      }
    }

    return true;
  });

  // Sort patients based on sort criteria
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    switch(sortBy) {
      case 'healthScore':
        return a.healthScore.current - b.healthScore.current;
      case 'name':
        return `${a.lastName}, ${a.firstName}`.localeCompare(`${b.lastName}, ${b.firstName}`);
      case 'riskLevel':
        const riskOrder = { 'High': 0, 'Moderate': 1, 'Low': 2 };
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      case 'alerts':
        return b.alerts.length - a.alerts.length;
      default:
        return 0;
    }
  });

  // Handle patient selection
  const handlePatientSelect = (patientId) => {
    const patient = patients.find(p => p.id === patientId);
    setSelectedPatient(patient);
  };

  // Handle patient message
  const handlePatientMessage = (patientId) => {
    handlePatientSelect(patientId);
    // Additional logic to focus on messaging panel
  };

  // Handle telehealth appointment
  const handleTelehealthAppointment = (patientId) => {
    // Logic to schedule or join telehealth appointment
  };

  // Handle alert resolution
  const handleResolveAlert = (alertId) => {
    // Logic to resolve alert
  };

  // Handle alert assignment
  const handleAssignAlert = (alertId) => {
    // Logic to assign alert
  };

  // Handle sending message
  const handleSendMessage = (message) => {
    if (!selectedPatient) return;

    const newMessage = {
      id: `msg${messages.length + 1}`,
      content: message,
      timestamp: new Date().toISOString(),
      senderType: 'clinician',
      sender: {
        id: 'nurse1',
        name: 'Sarah Johnson, RN'
      },
      status: 'sent'
    };

    setMessages([...messages, newMessage]);
  };

  // Handle scheduling appointment
  const handleScheduleAppointment = () => {
    // Logic to schedule new appointment
  };

  // Handle joining appointment
  const handleJoinAppointment = (appointmentId) => {
    // Logic to join telehealth appointment
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Header */}
        <Grid item xs={12}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4">RN Clinical Dashboard</Typography>

            <Box display="flex" alignItems="center">
              <TextField
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ width: 250, mr: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />

              <TextField
                select
                label="Filter"
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ width: 150, mr: 2 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FilterListIcon />
                    </InputAdornment>
                  )
                }}
              >
                <MenuItem value="all">All Patients</MenuItem>
                <MenuItem value="high">High Risk</MenuItem>
                <MenuItem value="moderate">Moderate Risk</MenuItem>
                <MenuItem value="low">Low Risk</MenuItem>
                <MenuItem value="alerts">With Alerts</MenuItem>
              </TextField>

              <TextField
                select
                label="Sort By"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                variant="outlined"
                size="small"
                sx={{ width: 150 }}
              >
                <MenuItem value="healthScore">Health Score</MenuItem>
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="riskLevel">Risk Level</MenuItem>
                <MenuItem value="alerts">Alerts</MenuItem>
              </TextField>
            </Box>
          </Box>
        </Grid>

        {/* TODO: Add the rest of the dashboard content here */}
        <Grid item xs={12}>
          <Typography variant="body1">Dashboard content goes here...</Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default RNDashboardScreen;
