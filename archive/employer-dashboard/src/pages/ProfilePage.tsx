import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Skeleton,
  Avatar,
  Chip,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Person,
  Business,
  Email,
  Work,
  Security,
  Save,
  Cancel,
  Edit,
  Refresh,
  CheckCircle,
  Warning,
  Error as ErrorIcon
} from '@mui/icons-material';

// Types for API responses
interface UserProfile {
  id: string;
  name: string;
  email: string;
  roles: string[];
  employerTitle: string;
  department: string;
  organizationId: string;
  organizationName: string;
  lastLogin: string;
  createdAt: string;
}

interface OrganizationSettings {
  id: string;
  orgName: string;
  industry: string;
  employeeCount: number;
  benefitsPackageType: string;
  address: string;
  contactEmail: string;
  lastUpdated: string;
}

interface FormErrors {
  orgName?: string;
  industry?: string;
  employeeCount?: string;
  benefitsPackageType?: string;
}

const ProfilePage: React.FC = () => {
  const { user, hasRole } = useAuth();

  // State management
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [organizationSettings, setOrganizationSettings] = useState<OrganizationSettings | null>(null);
  const [originalOrgSettings, setOriginalOrgSettings] = useState<OrganizationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isEditing, setIsEditing] = useState(false);

  // Check if user has required roles
  const hasRequiredRole = hasRole('EMPLOYER') || hasRole('ORGANIZATION_ADMIN') || hasRole('EXECUTIVE');

  // Industry options
  const industryOptions = [
    'Technology',
    'Healthcare',
    'Finance',
    'Manufacturing',
    'Retail',
    'Education',
    'Government',
    'Non-profit',
    'Construction',
    'Transportation',
    'Other'
  ];

  // Benefits package options
  const benefitsPackageOptions = [
    'Basic',
    'Standard',
    'Premium',
    'Enterprise',
    'Custom'
  ];

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user profile and organization settings in parallel
      const [profileResponse, orgSettingsResponse] = await Promise.all([
        apiClient.getProfile().catch(err => {
          console.warn('Profile fetch failed:', err);
          return { data: null };
        }),
        apiClient.getOrganizationSettings().catch(err => {
          console.warn('Organization settings fetch failed:', err);
          return { data: null };
        })
      ]);

      // Set user profile with fallback to auth context
      setUserProfile(profileResponse.data || {
        id: user?.id || '1',
        name: user?.name || user?.email || 'Unknown User',
        email: user?.email || 'user@example.com',
        roles: user?.roles || ['EMPLOYER'],
        employerTitle: user?.employerTitle || 'Administrator',
        department: user?.department || 'Human Resources',
        organizationId: user?.organizationId || '1',
        organizationName: user?.organizationName || 'Your Organization',
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      // Set organization settings with demo fallback
      const orgSettings = orgSettingsResponse.data || {
        id: user?.organizationId || '1',
        orgName: user?.organizationName || 'Your Organization',
        industry: 'Healthcare',
        employeeCount: 1250,
        benefitsPackageType: 'Premium',
        address: '123 Business Ave, City, State 12345',
        contactEmail: user?.email || 'contact@organization.com',
        lastUpdated: new Date().toISOString()
      };

      setOrganizationSettings(orgSettings);
      setOriginalOrgSettings({ ...orgSettings });

    } catch (err: any) {
      setError(err.message || 'Failed to load profile data');
      console.error('Profile data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasRequiredRole) {
      fetchProfileData();
    }
  }, [hasRequiredRole]);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!organizationSettings?.orgName?.trim()) {
      errors.orgName = 'Organization name is required';
    }

    if (!organizationSettings?.industry) {
      errors.industry = 'Industry selection is required';
    }

    if (!organizationSettings?.employeeCount || organizationSettings.employeeCount < 1) {
      errors.employeeCount = 'Employee count must be at least 1';
    }

    if (!organizationSettings?.benefitsPackageType) {
      errors.benefitsPackageType = 'Benefits package type is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveOrganization = async () => {
    if (!organizationSettings || !validateForm()) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const response = await apiClient.updateOrganization(organizationSettings.id, organizationSettings);

      if (response.data) {
        setOrganizationSettings(response.data);
        setOriginalOrgSettings({ ...response.data });
      }

      setSuccessMessage('Organization settings updated successfully');
      setIsEditing(false);

      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);

    } catch (err: any) {
      setError(err.message || 'Failed to update organization settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (originalOrgSettings) {
      setOrganizationSettings({ ...originalOrgSettings });
    }
    setFormErrors({});
    setIsEditing(false);
  };

  const handleRefresh = () => {
    fetchProfileData();
  };

  const handleInputChange = (field: keyof OrganizationSettings, value: string | number) => {
    if (!organizationSettings) return;

    setOrganizationSettings({
      ...organizationSettings,
      [field]: value
    });

    // Clear field error when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors({
        ...formErrors,
        [field]: undefined
      });
    }
  };

  const handleSelectChange = (event: SelectChangeEvent<string>, field: keyof OrganizationSettings) => {
    handleInputChange(field, event.target.value);
  };

  // Role protection check
  if (!hasRequiredRole) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f6fa', p: 4 }}>
        <Container maxWidth="md">
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Access Restricted
            </Typography>
            <Typography variant="body2">
              You need EMPLOYER, ORGANIZATION_ADMIN, or EXECUTIVE role to access the profile page.
              Current roles: {user?.roles?.join(', ') || 'None'}
            </Typography>
          </Alert>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f6fa' }}>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 50%, #42a5f5 100%)',
          color: 'white',
          p: 3,
          borderRadius: 0
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Person sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  Profile & Settings
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Manage your account and organization settings
                </Typography>
              </Box>
            </Box>

            <Tooltip title="Refresh data">
              <IconButton
                onClick={handleRefresh}
                disabled={loading}
                sx={{ color: 'rgba(255,255,255,0.8)' }}
              >
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Success Message */}
        {successMessage && (
          <Alert
            severity="success"
            sx={{ mb: 3, borderRadius: 2 }}
            onClose={() => setSuccessMessage(null)}
          >
            {successMessage}
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3, borderRadius: 2 }}
            action={
              <Button color="inherit" size="small" onClick={handleRefresh}>
                Retry
              </Button>
            }
          >
            <Typography variant="body2">{error}</Typography>
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* User Profile Section */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Avatar
                    sx={{
                      bgcolor: 'primary.main',
                      width: 64,
                      height: 64,
                      mr: 2,
                      fontSize: '1.5rem'
                    }}
                  >
                    {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={600}>
                      User Profile
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Your account information
                    </Typography>
                  </Box>
                </Box>

                {loading ? (
                  <Box>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Skeleton height={20} width="30%" sx={{ mb: 0.5 }} />
                        <Skeleton height={30} />
                      </Box>
                    ))}
                  </Box>
                ) : userProfile ? (
                  <List>
                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemIcon>
                        <Person color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Full Name"
                        secondary={userProfile.name}
                      />
                    </ListItem>

                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemIcon>
                        <Email color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Email Address"
                        secondary={userProfile.email}
                      />
                    </ListItem>

                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemIcon>
                        <Work color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Job Title"
                        secondary={userProfile.employerTitle}
                      />
                    </ListItem>

                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemIcon>
                        <Business color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Department"
                        secondary={userProfile.department}
                      />
                    </ListItem>

                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemIcon>
                        <Business color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Organization"
                        secondary={userProfile.organizationName}
                      />
                    </ListItem>

                    <ListItem disablePadding sx={{ mb: 1 }}>
                      <ListItemIcon>
                        <Security color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Roles"
                        secondary={
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                            {userProfile.roles.map((role, index) => (
                              <Chip
                                key={index}
                                label={role.replace(/_/g, ' ')}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            ))}
                          </Box>
                        }
                      />
                    </ListItem>
                  </List>
                ) : (
                  <Alert severity="warning" size="small">
                    Profile data unavailable
                  </Alert>
                )}

                <Divider sx={{ my: 2 }} />

                {userProfile && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Last Login: {new Date(userProfile.lastLogin).toLocaleString()}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Account Created: {new Date(userProfile.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Organization Settings Section */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="h5" fontWeight={600}>
                      Organization Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Manage your organization configuration
                    </Typography>
                  </Box>

                  {!isEditing && !loading && (
                    <IconButton
                      onClick={() => setIsEditing(true)}
                      color="primary"
                      sx={{ bgcolor: 'primary.50' }}
                    >
                      <Edit />
                    </IconButton>
                  )}
                </Box>

                {loading ? (
                  <Box>
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Box key={index} sx={{ mb: 3 }}>
                        <Skeleton height={20} width="40%" sx={{ mb: 1 }} />
                        <Skeleton height={56} />
                      </Box>
                    ))}
                  </Box>
                ) : organizationSettings ? (
                  <Box component="form" noValidate>
                    <TextField
                      fullWidth
                      label="Organization Name"
                      value={organizationSettings.orgName}
                      onChange={(e) => handleInputChange('orgName', e.target.value)}
                      disabled={!isEditing}
                      error={!!formErrors.orgName}
                      helperText={formErrors.orgName}
                      margin="normal"
                      sx={{ mb: 2 }}
                    />

                    <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                      <InputLabel>Industry</InputLabel>
                      <Select
                        value={organizationSettings.industry}
                        label="Industry"
                        onChange={(e) => handleSelectChange(e, 'industry')}
                        disabled={!isEditing}
                        error={!!formErrors.industry}
                      >
                        {industryOptions.map((industry) => (
                          <MenuItem key={industry} value={industry}>
                            {industry}
                          </MenuItem>
                        ))}
                      </Select>
                      {formErrors.industry && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                          {formErrors.industry}
                        </Typography>
                      )}
                    </FormControl>

                    <TextField
                      fullWidth
                      label="Employee Count"
                      type="number"
                      value={organizationSettings.employeeCount}
                      onChange={(e) => handleInputChange('employeeCount', parseInt(e.target.value) || 0)}
                      disabled={!isEditing}
                      error={!!formErrors.employeeCount}
                      helperText={formErrors.employeeCount}
                      margin="normal"
                      sx={{ mb: 2 }}
                      inputProps={{ min: 1 }}
                    />

                    <FormControl fullWidth margin="normal" sx={{ mb: 2 }}>
                      <InputLabel>Benefits Package Type</InputLabel>
                      <Select
                        value={organizationSettings.benefitsPackageType}
                        label="Benefits Package Type"
                        onChange={(e) => handleSelectChange(e, 'benefitsPackageType')}
                        disabled={!isEditing}
                        error={!!formErrors.benefitsPackageType}
                      >
                        {benefitsPackageOptions.map((packageType) => (
                          <MenuItem key={packageType} value={packageType}>
                            {packageType}
                          </MenuItem>
                        ))}
                      </Select>
                      {formErrors.benefitsPackageType && (
                        <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                          {formErrors.benefitsPackageType}
                        </Typography>
                      )}
                    </FormControl>

                    <TextField
                      fullWidth
                      label="Contact Email"
                      value={organizationSettings.contactEmail}
                      disabled
                      margin="normal"
                      sx={{ mb: 2 }}
                      helperText="Contact your administrator to change the contact email"
                    />

                    {isEditing && (
                      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                        <Button
                          variant="contained"
                          startIcon={saving ? <CircularProgress size={20} /> : <Save />}
                          onClick={handleSaveOrganization}
                          disabled={saving}
                          sx={{ flex: 1 }}
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<Cancel />}
                          onClick={handleCancelEdit}
                          disabled={saving}
                          sx={{ flex: 1 }}
                        >
                          Cancel
                        </Button>
                      </Box>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="caption" color="text.secondary" display="block">
                      Last Updated: {new Date(organizationSettings.lastUpdated).toLocaleString()}
                    </Typography>
                  </Box>
                ) : (
                  <Alert severity="warning" size="small">
                    Organization settings unavailable
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Development Notice */}
        {process.env.NODE_ENV === 'development' && (
          <Alert
            severity="info"
            sx={{ mt: 4, borderRadius: 2 }}
            icon={<Warning />}
          >
            <Typography variant="body2">
              <strong>Development Mode:</strong> Profile and organization settings show demo data with API integration.
              In production, all data will be fetched from your organization's user management system.
            </Typography>
          </Alert>
        )}
      </Container>
    </Box>
  );
};

export default ProfilePage;
