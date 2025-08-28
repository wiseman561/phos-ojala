import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
  AppBar,
  Toolbar,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  LinearProgress,
  IconButton,
  Skeleton,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  LocalHospital,
  Logout,
  FavoriteRounded,
  TrendingUp,
  TrendingDown,
  Schedule,
  MonitorHeart,
  VideoCall,
  Message,
  Assignment,
  Refresh,
  Analytics,
  NotificationsActive,
} from '@mui/icons-material';

import { useAuth } from '../contexts/auth/AuthContext';
import { patientApi, handleApiError } from '../services/apiClient';

// TypeScript interfaces
interface HealthScore {
  overall: number;
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: string;
  categories: {
    cardiovascular: number;
    metabolic: number;
    mental: number;
    lifestyle: number;
  };
}

interface VitalReading {
  id: string;
  type: 'blood_pressure' | 'heart_rate' | 'weight' | 'temperature' | 'oxygen_saturation';
  value: string;
  unit: string;
  timestamp: string;
  status: 'normal' | 'elevated' | 'critical';
}

interface Appointment {
  id: string;
  providerName: string;
  specialty: string;
  dateTime: string;
  type: 'in_person' | 'telehealth';
  status: 'scheduled' | 'confirmed' | 'cancelled';
}

interface DashboardData {
  healthScore: HealthScore;
  recentVitals: VitalReading[];
  upcomingAppointments: Appointment[];
  unreadMessages: number;
  activeCareePlans: number;
}

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State management
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load dashboard data
  const loadDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Simulate API calls with mock data for now
      // TODO: Replace with actual API calls when backend is ready
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate loading

      const mockData: DashboardData = {
        healthScore: {
          overall: 85,
          trend: 'improving',
          lastUpdated: new Date().toISOString(),
          categories: {
            cardiovascular: 88,
            metabolic: 82,
            mental: 90,
            lifestyle: 78,
          }
        },
        recentVitals: [
          {
            id: '1',
            type: 'blood_pressure',
            value: '120/80',
            unit: 'mmHg',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            status: 'normal'
          },
          {
            id: '2',
            type: 'heart_rate',
            value: '72',
            unit: 'bpm',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            status: 'normal'
          },
          {
            id: '3',
            type: 'weight',
            value: '68.5',
            unit: 'kg',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            status: 'normal'
          }
        ],
        upcomingAppointments: [
          {
            id: '1',
            providerName: 'Dr. Sarah Johnson',
            specialty: 'Cardiology',
            dateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            type: 'telehealth',
            status: 'confirmed'
          },
          {
            id: '2',
            providerName: 'Dr. Michael Chen',
            specialty: 'General Practice',
            dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            type: 'in_person',
            status: 'scheduled'
          }
        ],
        unreadMessages: 3,
        activeCareePlans: 2
      };

      setDashboardData(mockData);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleRefresh = () => {
    loadDashboardData(true);
  };

  // Quick actions configuration
  const quickActions = [
    {
      title: 'View Telemetry',
      description: 'Check your health monitoring data',
      icon: <MonitorHeart />,
      color: '#4caf50',
      route: '/telemetry',
    },
    {
      title: 'Schedule Telehealth',
      description: 'Book a virtual appointment',
      icon: <VideoCall />,
      color: '#2196f3',
      route: '/telehealth',
    },
    {
      title: 'Messages',
      description: 'Secure provider communication',
      icon: <Message />,
      color: '#9c27b0',
      route: '/messages',
      badge: dashboardData?.unreadMessages || 0,
    },
    {
      title: 'Care Plans',
      description: 'View your treatment plans',
      icon: <Assignment />,
      color: '#ff9800',
      route: '/care-plans',
    },
  ];

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return <DashboardError error={error} onRetry={() => loadDashboardData()} />;
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0} sx={{ backgroundColor: 'white', color: 'text.primary' }}>
        <Toolbar>
          <LocalHospital sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'text.primary' }}>
            Patient Portal
          </Typography>

          <IconButton color="inherit" onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? <CircularProgress size={20} /> : <Refresh />}
          </IconButton>

          <Button
            variant="outlined"
            startIcon={<Logout />}
            onClick={handleLogout}
            sx={{ ml: 2 }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Welcome Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Welcome back, {user?.firstName || 'Patient'}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's your health overview and recent activity.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Health Score Overview */}
          <Grid item xs={12} md={8}>
            <HealthScoreCard healthScore={dashboardData?.healthScore} />
          </Grid>

          {/* Quick Actions */}
          <Grid item xs={12} md={4}>
            <QuickActionsCard actions={quickActions} />
          </Grid>

          {/* Recent Vitals */}
          <Grid item xs={12} md={6}>
            <VitalsCard vitals={dashboardData?.recentVitals || []} />
          </Grid>

          {/* Upcoming Appointments */}
          <Grid item xs={12} md={6}>
            <AppointmentsCard appointments={dashboardData?.upcomingAppointments || []} />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

// Health Score Card Component
const HealthScoreCard: React.FC<{ healthScore?: HealthScore }> = ({ healthScore }) => {
  if (!healthScore) return null;

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp color="success" />;
      case 'declining': return <TrendingDown color="error" />;
      default: return <Analytics color="info" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'success';
      case 'declining': return 'error';
      default: return 'info';
    }
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <FavoriteRounded sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Health Score Overview</Typography>
          <Box sx={{ ml: 'auto' }}>
            <Chip
              icon={getTrendIcon(healthScore.trend)}
              label={healthScore.trend.charAt(0).toUpperCase() + healthScore.trend.slice(1)}
              color={getTrendColor(healthScore.trend) as any}
              size="small"
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Typography variant="h2" color="primary.main" sx={{ mr: 2 }}>
            {healthScore.overall}
          </Typography>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Overall Score
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Last updated: {new Date(healthScore.lastUpdated).toLocaleDateString()}
            </Typography>
          </Box>
        </Box>

        {/* Category Breakdown */}
        <Grid container spacing={2}>
          {Object.entries(healthScore.categories).map(([category, score]) => (
            <Grid item xs={6} key={category}>
              <Box>
                <Typography variant="body2" gutterBottom>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LinearProgress
                    variant="determinate"
                    value={score}
                    sx={{ flexGrow: 1, mr: 1, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {score}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
      <CardActions>
        <Button size="small" startIcon={<Analytics />}>
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

// Vitals Card Component
const VitalsCard: React.FC<{ vitals: VitalReading[] }> = ({ vitals }) => {
  const getVitalIcon = (type: string) => {
    return <MonitorHeart color="primary" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'success';
      case 'elevated': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Vitals
        </Typography>

        {vitals.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No recent vital signs recorded.
          </Typography>
        ) : (
          <List>
            {vitals.map((vital) => (
              <ListItem key={vital.id} disablePadding>
                <ListItemAvatar>
                  <Avatar sx={{ backgroundColor: 'primary.light' }}>
                    {getVitalIcon(vital.type)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1">
                        {vital.type.replace('_', ' ').toUpperCase()}
                      </Typography>
                      <Chip
                        label={vital.status}
                        color={getStatusColor(vital.status) as any}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="h6" component="span">
                        {vital.value} {vital.unit}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                        {new Date(vital.timestamp).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
      <CardActions>
        <Button size="small" startIcon={<MonitorHeart />}>
          View All Vitals
        </Button>
      </CardActions>
    </Card>
  );
};

// Appointments Card Component
const AppointmentsCard: React.FC<{ appointments: Appointment[] }> = ({ appointments }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Upcoming Appointments
        </Typography>

        {appointments.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No upcoming appointments scheduled.
          </Typography>
        ) : (
          <List>
            {appointments.map((appointment) => (
              <ListItem key={appointment.id} disablePadding>
                <ListItemAvatar>
                  <Avatar sx={{ backgroundColor: 'secondary.light' }}>
                    {appointment.type === 'telehealth' ? <VideoCall /> : <Schedule />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={appointment.providerName}
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {appointment.specialty}
                      </Typography>
                      <Typography variant="body2" color="primary">
                        {new Date(appointment.dateTime).toLocaleDateString()} at{' '}
                        {new Date(appointment.dateTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Box>
                  }
                />
                <Chip
                  label={appointment.type}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
      <CardActions>
        <Button size="small" startIcon={<Schedule />}>
          View All Appointments
        </Button>
      </CardActions>
    </Card>
  );
};

// Quick Actions Card Component
const QuickActionsCard: React.FC<{ actions: any[] }> = ({ actions }) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Quick Actions
        </Typography>

        <Grid container spacing={2}>
          {actions.map((action, index) => (
            <Grid item xs={12} key={index}>
              <Paper
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    boxShadow: 2,
                  },
                }}
                onClick={() => navigate(action.route)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    sx={{
                      backgroundColor: action.color,
                      mr: 2,
                      width: 40,
                      height: 40,
                    }}
                  >
                    {action.icon}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight={500}>
                      {action.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {action.description}
                    </Typography>
                  </Box>
                  {action.badge > 0 && (
                    <Chip
                      label={action.badge}
                      color="error"
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};

// Loading Skeleton Component
const DashboardSkeleton: React.FC = () => (
  <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
    <AppBar position="static" elevation={0} sx={{ backgroundColor: 'white' }}>
      <Toolbar>
        <Skeleton variant="rectangular" width={120} height={32} />
        <Box sx={{ flexGrow: 1 }} />
        <Skeleton variant="rectangular" width={80} height={32} />
      </Toolbar>
    </AppBar>

    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Skeleton variant="text" width={300} height={40} sx={{ mb: 1 }} />
      <Skeleton variant="text" width={200} height={24} sx={{ mb: 4 }} />

      <Grid container spacing={3}>
        {[...Array(4)].map((_, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card>
              <CardContent>
                <Skeleton variant="text" width={150} height={24} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={150} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  </Box>
);

// Error Component
const DashboardError: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
    <Alert severity="error" sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Failed to Load Dashboard
      </Typography>
      <Typography variant="body2">{error}</Typography>
    </Alert>
    <Button variant="contained" onClick={onRetry} startIcon={<Refresh />}>
      Try Again
    </Button>
  </Container>
);

export default DashboardPage;
