import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Card, 
  CardHeader, 
  CardContent, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemAvatar, 
  Avatar, 
  Chip, 
  Divider,
  IconButton,
  TextField,
  InputAdornment
} from '@mui/material';
import { 
  Search as SearchIcon,
  Person as PersonIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Warning as WarningIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';

/**
 * MDAlertQueue Component
 * 
 * Displays a list of patients flagged for MD review, either by RNs or by the AI health score engine.
 * Allows sorting by urgency, last interaction, or condition.
 */
const MDAlertQueue = ({ onPatientSelect }) => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('urgency');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    // In a real implementation, this would fetch data from an API
    const fetchEscalatedPatients = async () => {
      try {
        // Mock data for demonstration
        const mockPatients = [
          {
            id: 'p1',
            name: 'John Smith',
            age: 67,
            gender: 'Male',
            healthScore: 42,
            condition: 'Type 2 Diabetes',
            lastInteraction: new Date(Date.now() - 3600000), // 1 hour ago
            escalatedBy: 'RN Sarah Johnson',
            escalationReason: 'Blood glucose consistently above 200 mg/dL for 3 days',
            urgency: 'high'
          },
          {
            id: 'p2',
            name: 'Maria Garcia',
            age: 58,
            gender: 'Female',
            healthScore: 51,
            condition: 'Rheumatoid Arthritis',
            lastInteraction: new Date(Date.now() - 7200000), // 2 hours ago
            escalatedBy: 'AI Health Score Engine',
            escalationReason: 'Significant increase in joint pain, health score dropped 15 points',
            urgency: 'medium'
          },
          {
            id: 'p3',
            name: 'Robert Chen',
            age: 72,
            gender: 'Male',
            healthScore: 38,
            condition: 'COPD',
            lastInteraction: new Date(Date.now() - 1800000), // 30 minutes ago
            escalatedBy: 'RN Michael Brown',
            escalationReason: 'Oxygen saturation below 90%, increased shortness of breath',
            urgency: 'critical'
          },
          {
            id: 'p4',
            name: 'Emily Wilson',
            age: 45,
            gender: 'Female',
            healthScore: 63,
            condition: 'Multiple Sclerosis',
            lastInteraction: new Date(Date.now() - 86400000), // 1 day ago
            escalatedBy: 'AI Health Score Engine',
            escalationReason: 'New symptoms reported, potential exacerbation',
            urgency: 'medium'
          },
          {
            id: 'p5',
            name: 'James Taylor',
            age: 61,
            gender: 'Male',
            healthScore: 47,
            condition: 'Crohn\'s Disease',
            lastInteraction: new Date(Date.now() - 43200000), // 12 hours ago
            escalatedBy: 'RN Lisa Martinez',
            escalationReason: 'Severe abdominal pain, potential flare-up',
            urgency: 'high'
          }
        ];
        
        setPatients(mockPatients);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching escalated patients:', error);
        setLoading(false);
      }
    };

    fetchEscalatedPatients();
  }, []);

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.condition.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.escalationReason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort patients based on sort field and direction
  const sortedPatients = [...filteredPatients].sort((a, b) => {
    if (sortField === 'urgency') {
      const urgencyOrder = { 'critical': 3, 'high': 2, 'medium': 1, 'low': 0 };
      return sortDirection === 'asc' 
        ? urgencyOrder[a.urgency] - urgencyOrder[b.urgency]
        : urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
    } else if (sortField === 'lastInteraction') {
      return sortDirection === 'asc'
        ? a.lastInteraction - b.lastInteraction
        : b.lastInteraction - a.lastInteraction;
    } else if (sortField === 'healthScore') {
      return sortDirection === 'asc'
        ? a.healthScore - b.healthScore
        : b.healthScore - a.healthScore;
    }
    return 0;
  });

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  return (
    <Card elevation={3}>
      <CardHeader 
        title="Patients Requiring MD Review" 
        subheader={`${sortedPatients.length} patients awaiting your review`}
      />
      <CardContent>
        <Box mb={2}>
          <TextField
            fullWidth
            placeholder="Search patients by name, condition, or reason"
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
        </Box>
        
        <Box display="flex" mb={1}>
          <Box display="flex" alignItems="center" mr={2}>
            <Typography variant="body2">Sort by:</Typography>
          </Box>
          <Box display="flex" alignItems="center" mr={2}>
            <Typography 
              variant="body2" 
              color={sortField === 'urgency' ? 'primary' : 'textSecondary'}
              sx={{ cursor: 'pointer', fontWeight: sortField === 'urgency' ? 'bold' : 'normal' }}
              onClick={() => handleSort('urgency')}
            >
              Urgency
            </Typography>
            {sortField === 'urgency' && (
              <IconButton size="small" onClick={() => handleSort('urgency')}>
                {sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
              </IconButton>
            )}
          </Box>
          <Box display="flex" alignItems="center" mr={2}>
            <Typography 
              variant="body2" 
              color={sortField === 'lastInteraction' ? 'primary' : 'textSecondary'}
              sx={{ cursor: 'pointer', fontWeight: sortField === 'lastInteraction' ? 'bold' : 'normal' }}
              onClick={() => handleSort('lastInteraction')}
            >
              Last Interaction
            </Typography>
            {sortField === 'lastInteraction' && (
              <IconButton size="small" onClick={() => handleSort('lastInteraction')}>
                {sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
              </IconButton>
            )}
          </Box>
          <Box display="flex" alignItems="center">
            <Typography 
              variant="body2" 
              color={sortField === 'healthScore' ? 'primary' : 'textSecondary'}
              sx={{ cursor: 'pointer', fontWeight: sortField === 'healthScore' ? 'bold' : 'normal' }}
              onClick={() => handleSort('healthScore')}
            >
              Health Score
            </Typography>
            {sortField === 'healthScore' && (
              <IconButton size="small" onClick={() => handleSort('healthScore')}>
                {sortDirection === 'asc' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
              </IconButton>
            )}
          </Box>
        </Box>
        
        <List>
          {loading ? (
            <Typography>Loading patients...</Typography>
          ) : sortedPatients.length === 0 ? (
            <Typography>No patients requiring review</Typography>
          ) : (
            sortedPatients.map((patient, index) => (
              <React.Fragment key={patient.id}>
                {index > 0 && <Divider variant="inset" component="li" />}
                <ListItem 
                  alignItems="flex-start" 
                  button 
                  onClick={() => onPatientSelect(patient)}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle1" component="span">
                          {patient.name}
                        </Typography>
                        <Chip 
                          label={patient.urgency.toUpperCase()} 
                          color={getUrgencyColor(patient.urgency)} 
                          size="small"
                          icon={patient.urgency === 'critical' ? <WarningIcon /> : undefined}
                        />
                      </Box>
                    }
                    secondary={
                      <React.Fragment>
                        <Typography
                          component="span"
                          variant="body2"
                          color="textPrimary"
                        >
                          {`${patient.age}${patient.gender ? ', ' + patient.gender : ''} • ${patient.condition} • Health Score: ${patient.healthScore}`}
                        </Typography>
                        <Typography component="div" variant="body2" color="textSecondary">
                          {`Escalated by: ${patient.escalatedBy}`}
                        </Typography>
                        <Typography component="div" variant="body2" color="textSecondary">
                          {`Reason: ${patient.escalationReason}`}
                        </Typography>
                        <Box display="flex" alignItems="center" mt={0.5}>
                          <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                          <Typography variant="caption" color="textSecondary">
                            {`Last interaction: ${formatDistanceToNow(patient.lastInteraction, { addSuffix: true })}`}
                          </Typography>
                        </Box>
                      </React.Fragment>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))
          )}
        </List>
      </CardContent>
    </Card>
  );
};

export default MDAlertQueue;
