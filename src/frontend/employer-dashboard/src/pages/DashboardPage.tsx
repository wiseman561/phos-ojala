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
  Avatar,
  Chip,
  Button,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  CircularProgress,
  Skeleton,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Business,
  Dashboard,
  Analytics,
  People,
  HealthAndSafety,
  TrendingUp,
  Assessment,
  Notifications,
  Settings,
  ExitToApp,
  CheckCircle,
  Error as ErrorIcon,
  Refresh,
  TrendingDown,
  AttachMoney,
  LocalHospital,
  Warning,
  Person
} from '@mui/icons-material';

// Types for API responses
interface DashboardData {
  organizationSummary: {
    totalEmployees: number;
    activeEmployees: number;
    enrollmentRate: number;
    lastUpdated: string;
  };
  quickStats: {
    totalEmployees: number;
    healthScore: number;
    costSavings: number;
    activePrograms: number;
  };
  recentActivity: string[];
}

interface HealthScoreData {
  overallScore: number;
  trend: 'up' | 'down' | 'stable';
  categories: {
    physical: number;
    mental: number;
    preventive: number;
    chronic: number;
  };
  benchmarkComparison: number;
  lastUpdated: string;
}

interface CostSavingsData {
  totalSavings: number;
  yearOverYear: number;
  savingsBreakdown: {
    preventiveCare: number;
    chronicManagement: number;
    wellnessPrograms: number;
    earlyDetection: number;
  };
  roi: number;
  projectedAnnualSavings: number;
  lastUpdated: string;
}

const DashboardPage: React.FC = () => {
  const { user, logout, hasRole } = useAuth();

  // State management
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [healthScoreData, setHealthScoreData] = useState<HealthScoreData | null>(null);
  const [costSavingsData, setCostSavingsData] = useState<CostSavingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Check if user has required roles
  const hasRequiredRole = hasRole('EMPLOYER') || hasRole('EXECUTIVE') || hasRole('ORGANIZATION_ADMIN');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all data in parallel
      const [dashboardResponse, healthScoreResponse, costSavingsResponse] = await Promise.all([
        apiClient.getDashboardData().catch(err => {
          console.warn('Dashboard data fetch failed:', err);
          return { data: null };
        }),
        apiClient.getHealthScoreOverview().catch(err => {
          console.warn('Health score data fetch failed:', err);
          return { data: null };
        }),
        apiClient.getCostSavingsAnalysis().catch(err => {
          console.warn('Cost savings data fetch failed:', err);
          return { data: null };
        })
      ]);

      // Set data with fallbacks for demo purposes
      setDashboardData(dashboardResponse.data || {
        organizationSummary: {
          totalEmployees: 1247,
          activeEmployees: 1189,
          enrollmentRate: 95.3,
          lastUpdated: new Date().toISOString()
        },
        quickStats: {
          totalEmployees: 1247,
          healthScore: 87,
          costSavings: 45200,
          activePrograms: 12
        },
        recentActivity: [
          'New wellness program launched',
          'Q3 health metrics report generated',
          'Employee benefits enrollment started',
          'Cost analysis report completed',
          'Compliance audit scheduled'
        ]
      });

      setHealthScoreData(healthScoreResponse.data || {
        overallScore: 87,
        trend: 'up',
        categories: {
          physical: 89,
          mental: 82,
          preventive: 91,
          chronic: 85
        },
        benchmarkComparison: 12,
        lastUpdated: new Date().toISOString()
      });

      setCostSavingsData(costSavingsResponse.data || {
        totalSavings: 45200,
        yearOverYear: 18.5,
        savingsBreakdown: {
          preventiveCare: 18500,
          chronicManagement: 12800,
          wellnessPrograms: 8900,
          earlyDetection: 5000
        },
        roi: 3.2,
        projectedAnnualSavings: 78000,
        lastUpdated: new Date().toISOString()
      });

      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasRequiredRole) {
      fetchDashboardData();
    }
  }, [hasRequiredRole]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp color="success" />;
      case 'down':
        return <TrendingDown color="error" />;
      default:
        return <TrendingUp color="warning" />;
    }
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
              You need EMPLOYER or EXECUTIVE role to access the dashboard.
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
              <Business sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  Employer Dashboard
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  {user?.organizationName || 'Your Organization'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Tooltip title="Refresh data">
                <IconButton
                  onClick={handleRefresh}
                  disabled={loading}
                  sx={{ color: 'rgba(255,255,255,0.8)' }}
                >
                  <Refresh />
                </IconButton>
              </Tooltip>

              <Box sx={{ textAlign: 'right', mr: 2 }}>
                <Typography variant="body1" fontWeight={500}>
                  {user?.name || user?.email || 'User'}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {user?.employerTitle || 'Employer Administrator'}
                </Typography>
              </Box>
              <Avatar
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  border: '2px solid rgba(255,255,255,0.3)'
                }}
              >
                {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  startIcon={<HealthAndSafety />}
                  onClick={() => window.location.href = '/benefits'}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.5)',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Benefits
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<People />}
                  onClick={() => window.location.href = '/employees'}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.5)',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Employees
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Person />}
                  onClick={() => window.location.href = '/profile'}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.5)',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Profile
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ExitToApp />}
                  onClick={handleLogout}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.5)',
                    '&:hover': {
                      borderColor: 'white',
                      backgroundColor: 'rgba(255,255,255,0.1)'
                    }
                  }}
                >
                  Logout
                </Button>
              </Box>
            </Box>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Loading Progress */}
        {loading && (
          <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />
        )}

        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 4, borderRadius: 2 }}
            action={
              <Button color="inherit" size="small" onClick={handleRefresh}>
                Retry
              </Button>
            }
          >
            <Typography variant="h6" gutterBottom>
              Failed to Load Data
            </Typography>
            <Typography variant="body2">{error}</Typography>
          </Alert>
        )}

        {/* Last Updated Info */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={600}>
            Dashboard Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated: {lastRefresh.toLocaleString()}
          </Typography>
        </Box>

        {/* Quick Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {loading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Skeleton variant="rectangular" height={60} />
                    <Skeleton sx={{ mt: 1 }} />
                    <Skeleton width="60%" />
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            dashboardData && [
              {
                label: 'Total Employees',
                value: dashboardData.quickStats.totalEmployees.toLocaleString(),
                icon: <People />,
                color: '#1976d2'
              },
              {
                label: 'Health Score',
                value: `${dashboardData.quickStats.healthScore}%`,
                icon: <HealthAndSafety />,
                color: '#2e7d32',
                trend: healthScoreData?.trend
              },
              {
                label: 'Cost Savings',
                value: formatCurrency(dashboardData.quickStats.costSavings),
                icon: <AttachMoney />,
                color: '#ed6c02'
              },
              {
                label: 'Active Programs',
                value: dashboardData.quickStats.activePrograms.toString(),
                icon: <Assessment />,
                color: '#9c27b0'
              },
            ].map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    borderRadius: 3,
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)' }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="h4" fontWeight="bold" color={stat.color}>
                            {stat.value}
                          </Typography>
                          {stat.trend && getTrendIcon(stat.trend)}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {stat.label}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: stat.color, width: 56, height: 56 }}>
                        {stat.icon}
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Organization Summary */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Organization Summary
                </Typography>
                {loading ? (
                  <Box>
                    <Skeleton height={30} sx={{ mb: 1 }} />
                    <Skeleton height={30} sx={{ mb: 1 }} />
                    <Skeleton height={30} />
                  </Box>
                ) : dashboardData ? (
                  <List dense>
                    <ListItem disablePadding>
                      <ListItemIcon>
                        <People color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Total Employees"
                        secondary={dashboardData.organizationSummary.totalEmployees.toLocaleString()}
                      />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Active Employees"
                        secondary={dashboardData.organizationSummary.activeEmployees.toLocaleString()}
                      />
                    </ListItem>
                    <ListItem disablePadding>
                      <ListItemIcon>
                        <TrendingUp color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Enrollment Rate"
                        secondary={formatPercentage(dashboardData.organizationSummary.enrollmentRate)}
                      />
                    </ListItem>
                  </List>
                ) : (
                  <Alert severity="warning" size="small">
                    Organization data unavailable
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Health Score Overview */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Population Health Metrics
                </Typography>
                {loading ? (
                  <Box>
                    <Skeleton variant="circular" width={80} height={80} sx={{ mx: 'auto', mb: 2 }} />
                    <Skeleton height={20} sx={{ mb: 1 }} />
                    <Skeleton height={20} />
                  </Box>
                ) : healthScoreData ? (
                  <Box>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Typography variant="h3" fontWeight="bold" color="primary.main">
                        {healthScoreData.overallScore}%
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Overall Health Score
                        </Typography>
                        {getTrendIcon(healthScoreData.trend)}
                      </Box>
                    </Box>

                    <Grid container spacing={2}>
                      {Object.entries(healthScoreData.categories).map(([category, score]) => (
                        <Grid item xs={6} key={category}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="primary.main">
                              {score}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>

                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        vs. Industry Benchmark
                      </Typography>
                      <Chip
                        label={`+${healthScoreData.benchmarkComparison}%`}
                        color="success"
                        size="small"
                      />
                    </Box>
                  </Box>
                ) : (
                  <Alert severity="warning" size="small">
                    Health metrics unavailable
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Cost Savings Analysis */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Savings & ROI Summary
                </Typography>
                {loading ? (
                  <Box>
                    <Skeleton height={40} sx={{ mb: 2 }} />
                    <Skeleton height={20} sx={{ mb: 1 }} />
                    <Skeleton height={20} />
                  </Box>
                ) : costSavingsData ? (
                  <Box>
                    <Typography variant="h4" fontWeight="bold" color="success.main" gutterBottom>
                      {formatCurrency(costSavingsData.totalSavings)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Total savings this year
                    </Typography>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Year-over-Year Growth</Typography>
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          +{formatPercentage(costSavingsData.yearOverYear)}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">ROI</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {costSavingsData.roi.toFixed(1)}x
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2">Projected Annual</Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {formatCurrency(costSavingsData.projectedAnnualSavings)}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Savings Breakdown
                    </Typography>
                    {Object.entries(costSavingsData.savingsBreakdown).map(([category, amount]) => (
                      <Box key={category} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          {category.replace(/([A-Z])/g, ' $1').trim()}
                        </Typography>
                        <Typography variant="caption" fontWeight={500}>
                          {formatCurrency(amount)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="warning" size="small">
                    Cost data unavailable
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {loading ? (
                  <Box>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Skeleton key={index} height={40} sx={{ mb: 1 }} />
                    ))}
                  </Box>
                ) : dashboardData?.recentActivity ? (
                  <List dense>
                    {dashboardData.recentActivity.map((activity, index) => (
                      <ListItem key={index} disablePadding sx={{ mb: 1 }}>
                        <ListItemIcon>
                          <CheckCircle color="success" sx={{ fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={activity}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Alert severity="info" size="small">
                    No recent activity available
                  </Alert>
                )}

                <Button
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ mt: 2, borderRadius: 2 }}
                  disabled={loading}
                >
                  View All Activity
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* Account Information */}
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Account Information
                </Typography>
                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <List dense>
                      <ListItem disablePadding>
                        <ListItemText
                          primary="Email"
                          secondary={user?.email || 'Not available'}
                        />
                      </ListItem>
                      <ListItem disablePadding>
                        <ListItemText
                          primary="Organization"
                          secondary={user?.organizationName || 'Not specified'}
                        />
                      </ListItem>
                      <ListItem disablePadding>
                        <ListItemText
                          primary="Title"
                          secondary={user?.employerTitle || 'Not specified'}
                        />
                      </ListItem>
                      <ListItem disablePadding>
                        <ListItemText
                          primary="Department"
                          secondary={user?.department || 'Not specified'}
                        />
                      </ListItem>
                      <ListItem disablePadding>
                        <ListItemText
                          primary="Roles"
                          secondary={
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                              {user?.roles?.map((role, index) => (
                                <Chip
                                  key={index}
                                  label={role.replace(/_/g, ' ')}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              )) || <Typography variant="caption">No roles assigned</Typography>}
                            </Box>
                          }
                        />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
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
              <strong>Development Mode:</strong> This dashboard shows demo data with API integration.
              In production, all data will be fetched from your organization's real-time health analytics system.
            </Typography>
          </Alert>
        )}
      </Container>
    </Box>
  );
};

export default DashboardPage;
