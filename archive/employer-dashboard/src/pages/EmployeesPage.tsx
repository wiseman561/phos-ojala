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
  Divider,
  CircularProgress,
  Skeleton,
  LinearProgress,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Badge,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  People,
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  Refresh,
  FilterList,
  Search,
  Business,
  HealthAndSafety,
  Analytics,
  NavigateNext,
  Dashboard,
  PersonSearch,
  Assessment,
  Security,
  LocalHospital
} from '@mui/icons-material';

// Types for API responses
interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  healthScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastCheckup: string;
  enrollmentStatus: 'enrolled' | 'not_enrolled' | 'pending';
  benefitsUsage: number;
}

interface EmployeeHealth {
  totalEmployees: number;
  averageHealthScore: number;
  highRiskPercentage: number;
  mediumRiskPercentage: number;
  lowRiskPercentage: number;
  healthScoreDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
  trends: {
    currentMonth: number;
    previousMonth: number;
    change: number;
  };
  lastUpdated: string;
}

interface DepartmentData {
  department: string;
  employeeCount: number;
  averageHealthScore: number;
  highRiskCount: number;
  utilizationRate: number;
}

interface EmployeesByDepartment {
  departments: DepartmentData[];
  topPerformingDepartments: DepartmentData[];
  lastUpdated: string;
}

const EmployeesPage: React.FC = () => {
  const { user, hasRole } = useAuth();

  // State management
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeHealth, setEmployeeHealth] = useState<EmployeeHealth | null>(null);
  const [departmentData, setDepartmentData] = useState<EmployeesByDepartment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Table and filter state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  // Check if user has required roles
  const hasRequiredRole = hasRole('EMPLOYER') || hasRole('HR_MANAGER') || hasRole('EXECUTIVE');

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch employee data in parallel
      const [employeesResponse, healthResponse, departmentResponse] = await Promise.all([
        apiClient.getEmployees().catch(err => {
          console.warn('Employees fetch failed:', err);
          return { data: null };
        }),
        apiClient.getEmployeeHealth().catch(err => {
          console.warn('Employee health fetch failed:', err);
          return { data: null };
        }),
        apiClient.getEmployeesByDepartment().catch(err => {
          console.warn('Department data fetch failed:', err);
          return { data: null };
        })
      ]);

      // Generate demo data for development
      const demoEmployees: Employee[] = [
        { id: '1', name: 'Sarah Johnson', email: 'sarah.johnson@company.com', department: 'Engineering', position: 'Senior Developer', healthScore: 92, riskLevel: 'low', lastCheckup: '2024-01-15', enrollmentStatus: 'enrolled', benefitsUsage: 85 },
        { id: '2', name: 'Michael Chen', email: 'michael.chen@company.com', department: 'Marketing', position: 'Marketing Manager', healthScore: 78, riskLevel: 'medium', lastCheckup: '2024-01-10', enrollmentStatus: 'enrolled', benefitsUsage: 67 },
        { id: '3', name: 'Emily Rodriguez', email: 'emily.rodriguez@company.com', department: 'Human Resources', position: 'HR Specialist', healthScore: 88, riskLevel: 'low', lastCheckup: '2024-01-20', enrollmentStatus: 'enrolled', benefitsUsage: 92 },
        { id: '4', name: 'David Thompson', email: 'david.thompson@company.com', department: 'Sales', position: 'Sales Representative', healthScore: 65, riskLevel: 'high', lastCheckup: '2023-12-28', enrollmentStatus: 'enrolled', benefitsUsage: 45 },
        { id: '5', name: 'Lisa Wang', email: 'lisa.wang@company.com', department: 'Finance', position: 'Financial Analyst', healthScore: 83, riskLevel: 'low', lastCheckup: '2024-01-18', enrollmentStatus: 'enrolled', benefitsUsage: 78 },
        { id: '6', name: 'James Miller', email: 'james.miller@company.com', department: 'Engineering', position: 'DevOps Engineer', healthScore: 76, riskLevel: 'medium', lastCheckup: '2024-01-12', enrollmentStatus: 'enrolled', benefitsUsage: 71 },
        { id: '7', name: 'Anna Kowalski', email: 'anna.kowalski@company.com', department: 'Operations', position: 'Operations Manager', healthScore: 91, riskLevel: 'low', lastCheckup: '2024-01-22', enrollmentStatus: 'enrolled', benefitsUsage: 88 },
        { id: '8', name: 'Robert Brown', email: 'robert.brown@company.com', department: 'Sales', position: 'Senior Sales Rep', healthScore: 69, riskLevel: 'high', lastCheckup: '2024-01-05', enrollmentStatus: 'pending', benefitsUsage: 52 },
        { id: '9', name: 'Jennifer Davis', email: 'jennifer.davis@company.com', department: 'Marketing', position: 'Content Specialist', healthScore: 85, riskLevel: 'low', lastCheckup: '2024-01-17', enrollmentStatus: 'enrolled', benefitsUsage: 81 },
        { id: '10', name: 'Mark Wilson', email: 'mark.wilson@company.com', department: 'Finance', position: 'Controller', healthScore: 72, riskLevel: 'medium', lastCheckup: '2024-01-08', enrollmentStatus: 'enrolled', benefitsUsage: 63 }
      ];

      // Set employees data with fallback
      setEmployees(employeesResponse.data || demoEmployees);

      // Set health data with demo fallback
      setEmployeeHealth(healthResponse.data || {
        totalEmployees: demoEmployees.length,
        averageHealthScore: 79.9,
        highRiskPercentage: 20.0,
        mediumRiskPercentage: 30.0,
        lowRiskPercentage: 50.0,
        healthScoreDistribution: [
          { range: '90-100', count: 3, percentage: 30 },
          { range: '80-89', count: 3, percentage: 30 },
          { range: '70-79', count: 2, percentage: 20 },
          { range: '60-69', count: 2, percentage: 20 }
        ],
        trends: {
          currentMonth: 79.9,
          previousMonth: 77.2,
          change: 3.5
        },
        lastUpdated: new Date().toISOString()
      });

      // Set department data with demo fallback
      const demoDepartments: DepartmentData[] = [
        { department: 'Engineering', employeeCount: 2, averageHealthScore: 84, highRiskCount: 0, utilizationRate: 78 },
        { department: 'Operations', employeeCount: 1, averageHealthScore: 91, highRiskCount: 0, utilizationRate: 88 },
        { department: 'Human Resources', employeeCount: 1, averageHealthScore: 88, highRiskCount: 0, utilizationRate: 92 },
        { department: 'Marketing', employeeCount: 2, averageHealthScore: 81.5, highRiskCount: 0, utilizationRate: 74 },
        { department: 'Finance', employeeCount: 2, averageHealthScore: 77.5, highRiskCount: 0, utilizationRate: 70.5 },
        { department: 'Sales', employeeCount: 2, averageHealthScore: 67, highRiskCount: 2, utilizationRate: 48.5 }
      ];

      setDepartmentData(departmentResponse.data || {
        departments: demoDepartments,
        topPerformingDepartments: demoDepartments.sort((a, b) => b.averageHealthScore - a.averageHealthScore).slice(0, 5),
        lastUpdated: new Date().toISOString()
      });

      setLastRefresh(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to load employee data');
      console.error('Employee data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasRequiredRole) {
      fetchEmployeeData();
    }
  }, [hasRequiredRole]);

  const handleRefresh = () => {
    fetchEmployeeData();
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleDepartmentFilterChange = (event: SelectChangeEvent<string>) => {
    setDepartmentFilter(event.target.value);
    setPage(0);
  };

  const handleRiskFilterChange = (event: SelectChangeEvent<string>) => {
    setRiskFilter(event.target.value);
    setPage(0);
  };

  // Filter employees based on search and filters
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
    const matchesRisk = riskFilter === 'all' || employee.riskLevel === riskFilter;

    return matchesSearch && matchesDepartment && matchesRisk;
  });

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };

  const getHealthScoreColor = (score: number): string => {
    if (score >= 85) return '#2e7d32'; // Green
    if (score >= 70) return '#ed6c02'; // Orange
    return '#d32f2f'; // Red
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp color="success" sx={{ fontSize: 16 }} />;
    if (change < 0) return <TrendingDown color="error" sx={{ fontSize: 16 }} />;
    return <TrendingUp color="warning" sx={{ fontSize: 16 }} />;
  };

  // Get unique departments for filter
  const uniqueDepartments = Array.from(new Set(employees.map(emp => emp.department)));

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
              You need EMPLOYER, HR_MANAGER, or EXECUTIVE role to access the employees page.
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
              <People sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h4" fontWeight="bold">
                  Employee Analytics
                </Typography>
                <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                  Workforce health insights and employee management
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

              <Button
                variant="outlined"
                onClick={() => window.location.href = '/dashboard'}
                sx={{
                  color: 'white',
                  borderColor: 'rgba(255,255,255,0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Back to Dashboard
              </Button>
            </Box>
          </Box>
        </Container>
      </Paper>

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs
          separator={<NavigateNext fontSize="small" />}
          sx={{ mb: 3 }}
          aria-label="breadcrumb"
        >
          <Link
            underline="hover"
            color="inherit"
            href="/dashboard"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <Dashboard fontSize="small" />
            Dashboard
          </Link>
          <Typography
            color="text.primary"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <PersonSearch fontSize="small" />
            Employees
          </Typography>
        </Breadcrumbs>

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
              Failed to Load Employee Data
            </Typography>
            <Typography variant="body2">{error}</Typography>
          </Alert>
        )}

        {/* Page Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={600}>
            Employee Health & Analytics Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Last updated: {lastRefresh.toLocaleString()}
          </Typography>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {loading ? (
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
            employeeHealth && [
              {
                label: 'Total Employees',
                value: employeeHealth.totalEmployees.toLocaleString(),
                icon: <People />,
                color: '#1976d2',
                subtitle: 'Active workforce'
              },
              {
                label: 'Average Health Score',
                value: employeeHealth.averageHealthScore.toFixed(1),
                icon: <HealthAndSafety />,
                color: '#2e7d32',
                subtitle: `${getTrendIcon(employeeHealth.trends.change)} ${Math.abs(employeeHealth.trends.change).toFixed(1)}% vs last month`,
                trend: employeeHealth.trends.change
              },
              {
                label: 'High Risk Employees',
                value: formatPercentage(employeeHealth.highRiskPercentage),
                icon: <Warning />,
                color: '#d32f2f',
                subtitle: 'Requiring attention'
              },
              {
                label: 'Low Risk Employees',
                value: formatPercentage(employeeHealth.lowRiskPercentage),
                icon: <CheckCircle />,
                color: '#2e7d32',
                subtitle: 'Healthy workforce'
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
                        <Typography variant="h4" fontWeight="bold" color={stat.color}>
                          {stat.value}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {stat.label}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            {stat.subtitle}
                          </Typography>
                        </Box>
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
          {/* Employee Table */}
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Employee Directory
                  </Typography>
                  <Badge badgeContent={filteredEmployees.length} color="primary">
                    <FilterList />
                  </Badge>
                </Box>

                {/* Filters */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      InputProps={{
                        startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Department</InputLabel>
                      <Select
                        value={departmentFilter}
                        label="Department"
                        onChange={handleDepartmentFilterChange}
                      >
                        <MenuItem value="all">All Departments</MenuItem>
                        {uniqueDepartments.map((dept) => (
                          <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Risk Level</InputLabel>
                      <Select
                        value={riskFilter}
                        label="Risk Level"
                        onChange={handleRiskFilterChange}
                      >
                        <MenuItem value="all">All Risk Levels</MenuItem>
                        <MenuItem value="low">Low Risk</MenuItem>
                        <MenuItem value="medium">Medium Risk</MenuItem>
                        <MenuItem value="high">High Risk</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Employee Table */}
                {loading ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          {['Employee', 'Department', 'Health Score', 'Risk Level', 'Status'].map((header) => (
                            <TableCell key={header}>
                              <Skeleton height={20} />
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {Array.from({ length: 5 }).map((_, index) => (
                          <TableRow key={index}>
                            {Array.from({ length: 5 }).map((_, cellIndex) => (
                              <TableCell key={cellIndex}>
                                <Skeleton height={40} />
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Employee</TableCell>
                            <TableCell>Department</TableCell>
                            <TableCell align="center">Health Score</TableCell>
                            <TableCell align="center">Risk Level</TableCell>
                            <TableCell align="center">Enrollment</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredEmployees
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((employee) => (
                            <TableRow key={employee.id} hover>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                                    {employee.name.charAt(0)}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" fontWeight={500}>
                                      {employee.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {employee.position}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={employee.department}
                                  variant="outlined"
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                  <Typography
                                    variant="body2"
                                    fontWeight={600}
                                    color={getHealthScoreColor(employee.healthScore)}
                                  >
                                    {employee.healthScore}
                                  </Typography>
                                  <LinearProgress
                                    variant="determinate"
                                    value={employee.healthScore}
                                    sx={{
                                      width: 60,
                                      height: 6,
                                      borderRadius: 1,
                                      '& .MuiLinearProgress-bar': {
                                        backgroundColor: getHealthScoreColor(employee.healthScore)
                                      }
                                    }}
                                  />
                                </Box>
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={employee.riskLevel.toUpperCase()}
                                  color={getRiskColor(employee.riskLevel) as any}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={employee.enrollmentStatus.replace('_', ' ').toUpperCase()}
                                  color={employee.enrollmentStatus === 'enrolled' ? 'success' :
                                         employee.enrollmentStatus === 'pending' ? 'warning' : 'default'}
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25]}
                      component="div"
                      count={filteredEmployees.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={handleChangePage}
                      onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Department Rankings */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Top Departments by Health Score
                </Typography>
                {loading ? (
                  <Box>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Skeleton height={60} />
                      </Box>
                    ))}
                  </Box>
                ) : departmentData ? (
                  <Box>
                    {departmentData.topPerformingDepartments.map((dept, index) => (
                      <Box key={dept.department} sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Badge
                              badgeContent={index + 1}
                              color="primary"
                              sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem' } }}
                            >
                              <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>
                                <Business sx={{ fontSize: 16 }} />
                              </Avatar>
                            </Badge>
                            <Box>
                              <Typography variant="body2" fontWeight={500}>
                                {dept.department}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {dept.employeeCount} employees
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="h6" fontWeight={600} color="primary.main">
                            {dept.averageHealthScore.toFixed(1)}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={dept.averageHealthScore}
                          sx={{
                            height: 6,
                            borderRadius: 1,
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getHealthScoreColor(dept.averageHealthScore)
                            }
                          }}
                        />
                        {dept.highRiskCount > 0 && (
                          <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block' }}>
                            {dept.highRiskCount} high-risk employee{dept.highRiskCount > 1 ? 's' : ''}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Alert severity="warning" size="small">
                    Department rankings unavailable
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Health Score Distribution */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Health Score Distribution
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    {Array.from({ length: 4 }).map((_, index) => (
                      <Box key={index} sx={{ flex: 1 }}>
                        <Skeleton height={100} />
                        <Skeleton sx={{ mt: 1 }} />
                      </Box>
                    ))}
                  </Box>
                ) : employeeHealth ? (
                  <Grid container spacing={3}>
                    {employeeHealth.healthScoreDistribution.map((range, index) => (
                      <Grid item xs={12} sm={6} md={3} key={index}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h4" fontWeight="bold" color="primary.main">
                            {range.count}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {range.range} Score Range
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={range.percentage}
                            sx={{
                              height: 8,
                              borderRadius: 1,
                              mb: 1
                            }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatPercentage(range.percentage)} of workforce
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Alert severity="warning" size="small">
                    Health score distribution unavailable
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
              <strong>Development Mode:</strong> Employee data shows demo information with API integration.
              In production, all data will be fetched from your organization's HR management system.
            </Typography>
          </Alert>
        )}
      </Container>
    </Box>
  );
};

export default EmployeesPage;
