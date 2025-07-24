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
  CardHeader,
  Button,
  TextField,
  Avatar,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Switch,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Divider,
  FormControlLabel,
  InputAdornment,
} from '@mui/material';
import {
  AccountCircle,
  ArrowBack,
  Edit,
  Save,
  Security,
  Notifications,
  Visibility,
  VisibilityOff,
  Phone,
  Email,
  Home,
  Emergency,
  MedicalServices,
  Delete,
  Download,
  CloudUpload,
  Settings,
  Lock,
  Shield,
  Key,
  History,
} from '@mui/icons-material';
import { format } from 'date-fns';

import { useAuth } from '../contexts/auth/AuthContext';
import { patientApi, handleApiError } from '../services/apiClient';

// TypeScript interfaces
interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email?: string;
  };
  insurance: {
    provider: string;
    policyNumber: string;
    groupNumber?: string;
  };
  medicalInfo: {
    allergies: string[];
    medications: string[];
    conditions: string[];
    bloodType?: string;
  };
  preferences: {
    language: string;
    timezone: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
    reminderNotifications: boolean;
    marketingEmails: boolean;
  };
  privacy: {
    profileVisibility: 'private' | 'limited' | 'public';
    shareDataForResearch: boolean;
    allowDataExport: boolean;
  };
  lastUpdated: string;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  sessionTimeout: number;
  passwordLastChanged: string;
  recentLogins: Array<{
    timestamp: string;
    ipAddress: string;
    location: string;
    device: string;
  }>;
}

interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  // State management
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);

  // Dialog states
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [deleteAccountDialogOpen, setDeleteAccountDialogOpen] = useState(false);
  const [exportDataDialogOpen, setExportDataDialogOpen] = useState(false);

  // Form states
  const [passwordForm, setPasswordForm] = useState<PasswordChangeRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Load user profile
  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API calls
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockProfile: UserProfile = {
        id: user?.id || 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: user?.email || 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        dateOfBirth: '1985-03-15',
        gender: 'male',
        address: {
          street: '123 Main Street',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94102',
          country: 'United States',
        },
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'Spouse',
          phone: '+1 (555) 987-6543',
          email: 'jane.doe@example.com',
        },
        insurance: {
          provider: 'Blue Cross Blue Shield',
          policyNumber: 'BC123456789',
          groupNumber: 'GRP001',
        },
        medicalInfo: {
          allergies: ['Penicillin', 'Peanuts'],
          medications: ['Metformin 500mg', 'Lisinopril 10mg'],
          conditions: ['Type 2 Diabetes', 'Hypertension'],
          bloodType: 'O+',
        },
        preferences: {
          language: 'English',
          timezone: 'America/Los_Angeles',
          emailNotifications: true,
          smsNotifications: true,
          reminderNotifications: true,
          marketingEmails: false,
        },
        privacy: {
          profileVisibility: 'private',
          shareDataForResearch: false,
          allowDataExport: true,
        },
        lastUpdated: new Date().toISOString(),
      };

      const mockSecuritySettings: SecuritySettings = {
        twoFactorEnabled: false,
        loginNotifications: true,
        sessionTimeout: 60,
        passwordLastChanged: new Date(Date.now() - 7776000000).toISOString(), // 90 days ago
        recentLogins: [
          {
            timestamp: new Date().toISOString(),
            ipAddress: '192.168.1.100',
            location: 'San Francisco, CA',
            device: 'Chrome on Windows',
          },
          {
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            ipAddress: '192.168.1.100',
            location: 'San Francisco, CA',
            device: 'Safari on iPhone',
          },
        ],
      };

      setProfile(mockProfile);
      setSecuritySettings(mockSecuritySettings);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // Save profile changes
  const saveProfile = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      setError(null);

      // TODO: Replace with actual API call: patientApi.profile.update(profile)
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess('Profile updated successfully');
      setEditMode(false);

      // Update auth context if needed
      if (user) {
        updateUser({
          ...user,
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
        });
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const changePassword = async () => {
    try {
      setSaving(true);
      setError(null);

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        setError('New passwords do not match');
        return;
      }

      if (passwordForm.newPassword.length < 8) {
        setError('New password must be at least 8 characters long');
        return;
      }

      // TODO: Replace with actual API call: patientApi.auth.changePassword(passwordForm)
      await new Promise(resolve => setTimeout(resolve, 1000));

      setSuccess('Password changed successfully');
      setPasswordDialogOpen(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  // Export user data
  const exportData = async () => {
    try {
      setSaving(true);
      setError(null);

      // TODO: Replace with actual API call: patientApi.profile.exportData()
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simulate file download
      const dataBlob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `patient-data-${format(new Date(), 'yyyy-MM-dd')}.json`;
      link.click();
      URL.revokeObjectURL(url);

      setSuccess('Data export completed');
      setExportDataDialogOpen(false);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  // Delete account
  const deleteAccount = async () => {
    try {
      setSaving(true);
      setError(null);

      // TODO: Replace with actual API call: patientApi.profile.deleteAccount()
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Logout and redirect
      logout();
      navigate('/login');
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSaving(false);
    }
  };

  // Toggle security setting
  const toggleSecuritySetting = async (setting: keyof SecuritySettings, value: boolean) => {
    if (!securitySettings) return;

    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500));

      setSecuritySettings(prev => prev ? ({ ...prev, [setting]: value }) : null);
      setSuccess(`Security setting updated`);
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Clear messages after delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Profile & Settings
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress size={50} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading your profile...
          </Typography>
        </Container>
      </Box>
    );
  }

  if (!profile) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Failed to load profile data</Alert>
      </Container>
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
          <AccountCircle sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Profile & Settings
          </Typography>
          {editMode ? (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                color="inherit"
                onClick={() => setEditMode(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                color="inherit"
                onClick={saveProfile}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} /> : <Save />}
              >
                Save
              </Button>
            </Box>
          ) : (
            <Button
              color="inherit"
              onClick={() => setEditMode(true)}
              startIcon={<Edit />}
            >
              Edit
            </Button>
          )}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert
            severity="success"
            sx={{ mb: 3 }}
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        {/* Profile Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar sx={{ width: 80, height: 80, fontSize: 32 }}>
              {profile.firstName.charAt(0)}{profile.lastName.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" gutterBottom>
                {profile.firstName} {profile.lastName}
              </Typography>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {profile.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last updated: {format(new Date(profile.lastUpdated), 'MMM dd, yyyy')}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              startIcon={<CloudUpload />}
              disabled={!editMode}
            >
              Upload Photo
            </Button>
          </Box>
        </Paper>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Personal Info" />
            <Tab label="Medical Info" />
            <Tab label="Preferences" />
            <Tab label="Security" />
            <Tab label="Privacy & Data" />
          </Tabs>
        </Paper>

        {/* Tab Content */}
        <Paper sx={{ p: 3 }}>
          {/* Personal Info Tab */}
          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="First Name"
                  fullWidth
                  value={profile.firstName}
                  onChange={(e) => setProfile(prev => prev ? ({ ...prev, firstName: e.target.value }) : null)}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Last Name"
                  fullWidth
                  value={profile.lastName}
                  onChange={(e) => setProfile(prev => prev ? ({ ...prev, lastName: e.target.value }) : null)}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email"
                  type="email"
                  fullWidth
                  value={profile.email}
                  onChange={(e) => setProfile(prev => prev ? ({ ...prev, email: e.target.value }) : null)}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Phone"
                  fullWidth
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => prev ? ({ ...prev, phone: e.target.value }) : null)}
                  disabled={!editMode}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Date of Birth"
                  type="date"
                  fullWidth
                  value={profile.dateOfBirth}
                  onChange={(e) => setProfile(prev => prev ? ({ ...prev, dateOfBirth: e.target.value }) : null)}
                  disabled={!editMode}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!editMode}>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={profile.gender}
                    label="Gender"
                    onChange={(e) => setProfile(prev => prev ? ({ ...prev, gender: e.target.value as any }) : null)}
                  >
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                    <MenuItem value="prefer_not_to_say">Prefer not to say</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Address */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  <Home sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Address
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Street Address"
                  fullWidth
                  value={profile.address.street}
                  onChange={(e) => setProfile(prev => prev ? ({
                    ...prev,
                    address: { ...prev.address, street: e.target.value }
                  }) : null)}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="City"
                  fullWidth
                  value={profile.address.city}
                  onChange={(e) => setProfile(prev => prev ? ({
                    ...prev,
                    address: { ...prev.address, city: e.target.value }
                  }) : null)}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="State"
                  fullWidth
                  value={profile.address.state}
                  onChange={(e) => setProfile(prev => prev ? ({
                    ...prev,
                    address: { ...prev.address, state: e.target.value }
                  }) : null)}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="ZIP Code"
                  fullWidth
                  value={profile.address.zipCode}
                  onChange={(e) => setProfile(prev => prev ? ({
                    ...prev,
                    address: { ...prev.address, zipCode: e.target.value }
                  }) : null)}
                  disabled={!editMode}
                />
              </Grid>

              {/* Emergency Contact */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  <Emergency sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Emergency Contact
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Contact Name"
                  fullWidth
                  value={profile.emergencyContact.name}
                  onChange={(e) => setProfile(prev => prev ? ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, name: e.target.value }
                  }) : null)}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Relationship"
                  fullWidth
                  value={profile.emergencyContact.relationship}
                  onChange={(e) => setProfile(prev => prev ? ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, relationship: e.target.value }
                  }) : null)}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Phone"
                  fullWidth
                  value={profile.emergencyContact.phone}
                  onChange={(e) => setProfile(prev => prev ? ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, phone: e.target.value }
                  }) : null)}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Email (Optional)"
                  fullWidth
                  value={profile.emergencyContact.email || ''}
                  onChange={(e) => setProfile(prev => prev ? ({
                    ...prev,
                    emergencyContact: { ...prev.emergencyContact, email: e.target.value }
                  }) : null)}
                  disabled={!editMode}
                />
              </Grid>
            </Grid>
          )}

          {/* Medical Info Tab */}
          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  <MedicalServices sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Medical Information
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label="Blood Type"
                  fullWidth
                  value={profile.medicalInfo.bloodType || ''}
                  onChange={(e) => setProfile(prev => prev ? ({
                    ...prev,
                    medicalInfo: { ...prev.medicalInfo, bloodType: e.target.value }
                  }) : null)}
                  disabled={!editMode}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Allergies
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.medicalInfo.allergies.map((allergy, index) => (
                    <Chip
                      key={index}
                      label={allergy}
                      onDelete={editMode ? () => {
                        setProfile(prev => prev ? ({
                          ...prev,
                          medicalInfo: {
                            ...prev.medicalInfo,
                            allergies: prev.medicalInfo.allergies.filter((_, i) => i !== index)
                          }
                        }) : null);
                      } : undefined}
                      color="error"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Current Medications
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.medicalInfo.medications.map((medication, index) => (
                    <Chip
                      key={index}
                      label={medication}
                      onDelete={editMode ? () => {
                        setProfile(prev => prev ? ({
                          ...prev,
                          medicalInfo: {
                            ...prev.medicalInfo,
                            medications: prev.medicalInfo.medications.filter((_, i) => i !== index)
                          }
                        }) : null);
                      } : undefined}
                      color="primary"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                  Medical Conditions
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {profile.medicalInfo.conditions.map((condition, index) => (
                    <Chip
                      key={index}
                      label={condition}
                      onDelete={editMode ? () => {
                        setProfile(prev => prev ? ({
                          ...prev,
                          medicalInfo: {
                            ...prev.medicalInfo,
                            conditions: prev.medicalInfo.conditions.filter((_, i) => i !== index)
                          }
                        }) : null);
                      } : undefined}
                      color="warning"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>

              {/* Insurance */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
                  Insurance Information
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Insurance Provider"
                  fullWidth
                  value={profile.insurance.provider}
                  onChange={(e) => setProfile(prev => prev ? ({
                    ...prev,
                    insurance: { ...prev.insurance, provider: e.target.value }
                  }) : null)}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Policy Number"
                  fullWidth
                  value={profile.insurance.policyNumber}
                  onChange={(e) => setProfile(prev => prev ? ({
                    ...prev,
                    insurance: { ...prev.insurance, policyNumber: e.target.value }
                  }) : null)}
                  disabled={!editMode}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Group Number (Optional)"
                  fullWidth
                  value={profile.insurance.groupNumber || ''}
                  onChange={(e) => setProfile(prev => prev ? ({
                    ...prev,
                    insurance: { ...prev.insurance, groupNumber: e.target.value }
                  }) : null)}
                  disabled={!editMode}
                />
              </Grid>
            </Grid>
          )}

          {/* Preferences Tab */}
          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  <Settings sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Preferences
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!editMode}>
                  <InputLabel>Language</InputLabel>
                  <Select
                    value={profile.preferences.language}
                    label="Language"
                    onChange={(e) => setProfile(prev => prev ? ({
                      ...prev,
                      preferences: { ...prev.preferences, language: e.target.value }
                    }) : null)}
                  >
                    <MenuItem value="English">English</MenuItem>
                    <MenuItem value="Spanish">Spanish</MenuItem>
                    <MenuItem value="French">French</MenuItem>
                    <MenuItem value="German">German</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={!editMode}>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={profile.preferences.timezone}
                    label="Timezone"
                    onChange={(e) => setProfile(prev => prev ? ({
                      ...prev,
                      preferences: { ...prev.preferences, timezone: e.target.value }
                    }) : null)}
                  >
                    <MenuItem value="America/New_York">Eastern Time</MenuItem>
                    <MenuItem value="America/Chicago">Central Time</MenuItem>
                    <MenuItem value="America/Denver">Mountain Time</MenuItem>
                    <MenuItem value="America/Los_Angeles">Pacific Time</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  <Notifications sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Notification Preferences
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Email />
                    </ListItemIcon>
                    <ListItemText
                      primary="Email Notifications"
                      secondary="Receive appointment reminders and health updates via email"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={profile.preferences.emailNotifications}
                        onChange={(e) => setProfile(prev => prev ? ({
                          ...prev,
                          preferences: { ...prev.preferences, emailNotifications: e.target.checked }
                        }) : null)}
                        disabled={!editMode}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <Phone />
                    </ListItemIcon>
                    <ListItemText
                      primary="SMS Notifications"
                      secondary="Receive urgent notifications and reminders via text message"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={profile.preferences.smsNotifications}
                        onChange={(e) => setProfile(prev => prev ? ({
                          ...prev,
                          preferences: { ...prev.preferences, smsNotifications: e.target.checked }
                        }) : null)}
                        disabled={!editMode}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <Notifications />
                    </ListItemIcon>
                    <ListItemText
                      primary="Medication Reminders"
                      secondary="Receive reminders for medication schedules and refills"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={profile.preferences.reminderNotifications}
                        onChange={(e) => setProfile(prev => prev ? ({
                          ...prev,
                          preferences: { ...prev.preferences, reminderNotifications: e.target.checked }
                        }) : null)}
                        disabled={!editMode}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <Email />
                    </ListItemIcon>
                    <ListItemText
                      primary="Marketing Emails"
                      secondary="Receive updates about new features and health tips"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={profile.preferences.marketingEmails}
                        onChange={(e) => setProfile(prev => prev ? ({
                          ...prev,
                          preferences: { ...prev.preferences, marketingEmails: e.target.checked }
                        }) : null)}
                        disabled={!editMode}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </Grid>
            </Grid>
          )}

          {/* Security Tab */}
          {activeTab === 3 && securitySettings && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Security Settings
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Password
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Last changed: {format(new Date(securitySettings.passwordLastChanged), 'MMM dd, yyyy')}
                    </Typography>
                    <Button
                      variant="outlined"
                      onClick={() => setPasswordDialogOpen(true)}
                      startIcon={<Key />}
                    >
                      Change Password
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Shield />
                    </ListItemIcon>
                    <ListItemText
                      primary="Two-Factor Authentication"
                      secondary="Add an extra layer of security to your account"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={securitySettings.twoFactorEnabled}
                        onChange={(e) => toggleSecuritySetting('twoFactorEnabled', e.target.checked)}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <Notifications />
                    </ListItemIcon>
                    <ListItemText
                      primary="Login Notifications"
                      secondary="Get notified when someone logs into your account"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={securitySettings.loginNotifications}
                        onChange={(e) => toggleSecuritySetting('loginNotifications', e.target.checked)}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  <History sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Recent Login Activity
                </Typography>
                <List>
                  {securitySettings.recentLogins.map((login, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`${login.device} from ${login.location}`}
                        secondary={`${format(new Date(login.timestamp), 'MMM dd, yyyy h:mm a')} - IP: ${login.ipAddress}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          )}

          {/* Privacy & Data Tab */}
          {activeTab === 4 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  <Lock sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Privacy & Data Management
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Visibility />
                    </ListItemIcon>
                    <ListItemText
                      primary="Share Data for Medical Research"
                      secondary="Help improve healthcare by anonymously sharing your data for research"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={profile.privacy.shareDataForResearch}
                        onChange={(e) => setProfile(prev => prev ? ({
                          ...prev,
                          privacy: { ...prev.privacy, shareDataForResearch: e.target.checked }
                        }) : null)}
                        disabled={!editMode}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <Download />
                    </ListItemIcon>
                    <ListItemText
                      primary="Allow Data Export"
                      secondary="Enable the ability to download your complete health data"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        checked={profile.privacy.allowDataExport}
                        onChange={(e) => setProfile(prev => prev ? ({
                          ...prev,
                          privacy: { ...prev.privacy, allowDataExport: e.target.checked }
                        }) : null)}
                        disabled={!editMode}
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Data Management
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Export Your Data
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Download a complete copy of your health data in JSON format.
                        </Typography>
                        <Button
                          variant="outlined"
                          onClick={() => setExportDataDialogOpen(true)}
                          startIcon={<Download />}
                          disabled={!profile.privacy.allowDataExport}
                        >
                          Export Data
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="error">
                          Delete Account
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Permanently delete your account and all associated data.
                        </Typography>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => setDeleteAccountDialogOpen(true)}
                          startIcon={<Delete />}
                        >
                          Delete Account
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          )}
        </Paper>

        {/* Password Change Dialog */}
        <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Change Password</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  label="Current Password"
                  type={showPasswords.current ? 'text' : 'password'}
                  fullWidth
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                        >
                          {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="New Password"
                  type={showPasswords.new ? 'text' : 'password'}
                  fullWidth
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        >
                          {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Confirm New Password"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  fullWidth
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        >
                          {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
            <Button onClick={changePassword} variant="contained" disabled={saving}>
              Change Password
            </Button>
          </DialogActions>
        </Dialog>

        {/* Export Data Dialog */}
        <Dialog open={exportDataDialogOpen} onClose={() => setExportDataDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Export Your Data</DialogTitle>
          <DialogContent>
            <Typography variant="body1" paragraph>
              This will create a comprehensive download of all your health data including:
            </Typography>
            <List>
              <ListItem>
                <ListItemText primary="• Personal and contact information" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Medical history and conditions" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Medication and allergy information" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Appointment and care plan data" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Telemetry and health monitoring data" />
              </ListItem>
            </List>
            <Alert severity="info">
              The export will be provided in JSON format and may take a few minutes to prepare.
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setExportDataDialogOpen(false)}>Cancel</Button>
            <Button onClick={exportData} variant="contained" disabled={saving}>
              {saving ? 'Preparing Export...' : 'Export Data'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Account Dialog */}
        <Dialog open={deleteAccountDialogOpen} onClose={() => setDeleteAccountDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle color="error">Delete Account</DialogTitle>
          <DialogContent>
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                This action cannot be undone!
              </Typography>
              <Typography variant="body2">
                Deleting your account will permanently remove all your data including:
              </Typography>
            </Alert>
            <List>
              <ListItem>
                <ListItemText primary="• All personal and medical information" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Care plans and treatment history" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Messages and communications" />
              </ListItem>
              <ListItem>
                <ListItemText primary="• Telemetry and monitoring data" />
              </ListItem>
            </List>
            <Typography variant="body2" color="text.secondary">
              If you only want to stop using the service temporarily, consider disabling notifications instead.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteAccountDialogOpen(false)}>Cancel</Button>
            <Button onClick={deleteAccount} color="error" variant="contained" disabled={saving}>
              {saving ? 'Deleting...' : 'Delete Account'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default ProfilePage;
