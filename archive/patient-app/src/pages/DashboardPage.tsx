import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  IconButton,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  Button,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  AccountCircle,
  Logout,
  MonitorHeart,
  CalendarToday,
  Message,
  Settings,
  TrendingUp,
  TrendingDown,
  Notifications,
} from '@mui/icons-material';
import { useAuth } from '../contexts/auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    logout();
    navigate('/login');
  };

  // Mock data for demonstration
  const healthScore = 78;
  const recentVitals = {
    heartRate: { value: 72, unit: 'bpm', status: 'normal' },
    bloodPressure: { value: '120/80', unit: 'mmHg', status: 'normal' },
    weight: { value: 165, unit: 'lbs', status: 'normal' },
    glucose: { value: 95, unit: 'mg/dL', status: 'normal' },
  };

  const upcomingAppointments = [
    { id: 1, provider: 'Dr. Johnson', type: 'Check-up', date: '2024-01-15', time: '10:00 AM' },
    { id: 2, provider: 'Sarah RN', type: 'Follow-up', date: '2024-01-18', time: '2:30 PM' },
  ];

  const recentMessages = [
    { id: 1, from: 'Dr. Johnson', subject: 'Lab Results Available', date: '2024-01-10', unread: true },
    { id: 2, from: 'Care Team', subject: 'Medication Reminder', date: '2024-01-09', unread: false },
  ];

  return (
    <>
      {/* Navigation Header */}
      <AppBar position="static" sx={{ mb: 4, bgcolor: '#2e7d32' }}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            My Health Dashboard
          </Typography>

          <Button color="inherit" onClick={() => navigate('/dashboard')} sx={{ mr: 1 }}>
            Dashboard
          </Button>
          <Button color="inherit" onClick={() => navigate('/appointments')} sx={{ mr: 1 }}>
            Appointments
          </Button>
          <Button color="inherit" onClick={() => navigate('/messages')} sx={{ mr: 1 }}>
            Messages
          </Button>
          <Button color="inherit" onClick={() => navigate('/health-data')} sx={{ mr: 2 }}>
            Health Data
          </Button>

          {/* User Profile Menu */}
          <Box>
            <IconButton
              size="large"
              edge="end"
              aria-label="account of current user"
              aria-controls="profile-menu"
              aria-haspopup="true"
              onClick={handleProfileMenuOpen}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.dark' }}>
                {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
              </Avatar>
            </IconButton>
            <Menu
              id="profile-menu"
              anchorEl={anchorEl}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              keepMounted
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
            >
              <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/profile'); }}>
                <AccountCircle sx={{ mr: 1 }} />
                My Profile
              </MenuItem>
              <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/settings'); }}>
                <Settings sx={{ mr: 1 }} />
                Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                Logout
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Welcome back, {user?.firstName}!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's an overview of your health status and recent activity.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Health Score Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <MonitorHeart sx={{ color: 'primary.main', fontSize: 32, mr: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Health Score
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h2" color="primary.main" fontWeight="bold">
                    {healthScore}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    out of 100
                  </Typography>
                  <Chip
                    icon={<TrendingUp />}
                    label="Improving"
                    color="success"
                    size="small"
                  />
                  <LinearProgress
                    variant="determinate"
                    value={healthScore}
                    sx={{ mt: 2, height: 8, borderRadius: 4 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Vitals Card */}
          <Grid item xs={12} md={8}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Recent Vitals
                </Typography>
                <Grid container spacing={2}>
                  {Object.entries(recentVitals).map(([key, vital]) => (
                    <Grid item xs={6} key={key}>
                      <Box sx={{ textAlign: 'center', p: 1 }}>
                        <Typography variant="h5" fontWeight="bold">
                          {vital.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {vital.unit}
                        </Typography>
                        <Chip
                          label={vital.status}
                          color="success"
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Upcoming Appointments Card */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CalendarToday sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Upcoming Appointments
                  </Typography>
                </Box>
                {upcomingAppointments.map((appointment) => (
                  <Box key={appointment.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {appointment.provider}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {appointment.type} • {appointment.date} at {appointment.time}
                    </Typography>
                  </Box>
                ))}
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/appointments')}
                  sx={{ mt: 1 }}
                >
                  View All Appointments
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Messages Card */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Message sx={{ color: 'primary.main', mr: 1 }} />
                  <Typography variant="h6" fontWeight="bold">
                    Recent Messages
                  </Typography>
                </Box>
                {recentMessages.map((message) => (
                  <Box key={message.id} sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ flexGrow: 1 }}>
                        {message.from}
                      </Typography>
                      {message.unread && (
                        <Chip label="New" color="primary" size="small" />
                      )}
                    </Box>
                    <Typography variant="body2">
                      {message.subject}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {message.date}
                    </Typography>
                  </Box>
                ))}
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/messages')}
                  sx={{ mt: 1 }}
                >
                  View All Messages
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </>
  );
};

export default DashboardPage;
