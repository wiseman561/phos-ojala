import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  ButtonGroup,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  AppBar,
  Toolbar,
  LinearProgress,
} from '@mui/material';
import {
  MonitorHeart,
  Timeline,
  Analytics,
  Refresh,
  PlayArrow,
  Stop,
  ArrowBack,
  TrendingUp,
  TrendingDown,
  FiberManualRecord,
  Warning,
  CheckCircle,
  Psychology,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { format, subDays, subHours } from 'date-fns';

import { useAuth } from '../contexts/auth/AuthContext';
import { patientApi, handleApiError } from '../services/apiClient';

// TypeScript interfaces
interface TelemetryReading {
  timestamp: string;
  metric: 'heartRate' | 'bloodPressure' | 'oxygenSaturation' | 'temperature' | 'weight';
  value: number | string;
  unit: string;
}

interface TelemetryData {
  success: boolean;
  deviceId: string;
  data: TelemetryReading[];
}

interface MetricAnalysis {
  average: number;
  min: number;
  max: number;
  trend: 'improving' | 'stable' | 'declining';
  systolicAverage?: number;
  diastolicAverage?: number;
}

interface AnalysisResult {
  success: boolean;
  deviceId: string;
  patientId: string;
  metrics: {
    heartRate: MetricAnalysis;
    bloodPressure: MetricAnalysis;
    oxygenSaturation: MetricAnalysis;
  };
  insights: string[];
  riskScore: number;
  recommendations: string[];
}

type TimeRange = '24h' | '7d' | '30d' | '90d';

interface MetricConfig {
  key: string;
  label: string;
  color: string;
  unit: string;
  normalRange: { min: number; max: number };
}

const TelemetryPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [telemetryData, setTelemetryData] = useState<TelemetryReading[]>([]);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');
  const [realTimeEnabled, setRealTimeEnabled] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState({
    heartRate: true,
    bloodPressure: true,
    oxygenSaturation: true,
  });

  // Metric configurations
  const metricConfigs: Record<string, MetricConfig> = {
    heartRate: {
      key: 'heartRate',
      label: 'Heart Rate',
      color: '#ff6b6b',
      unit: 'bpm',
      normalRange: { min: 60, max: 100 },
    },
    bloodPressure: {
      key: 'bloodPressure',
      label: 'Blood Pressure',
      color: '#4ecdc4',
      unit: 'mmHg',
      normalRange: { min: 80, max: 140 }, // systolic
    },
    oxygenSaturation: {
      key: 'oxygenSaturation',
      label: 'Oxygen Saturation',
      color: '#45b7d1',
      unit: '%',
      normalRange: { min: 95, max: 100 },
    },
  };

  // Load telemetry data
  const loadTelemetryData = useCallback(async (range: TimeRange = timeRange) => {
    try {
      setLoading(true);
      setError(null);

      // Calculate date range
      const endDate = new Date();
      let startDate: Date;

      switch (range) {
        case '24h':
          startDate = subHours(endDate, 24);
          break;
        case '7d':
          startDate = subDays(endDate, 7);
          break;
        case '30d':
          startDate = subDays(endDate, 30);
          break;
        case '90d':
          startDate = subDays(endDate, 90);
          break;
        default:
          startDate = subDays(endDate, 7);
      }

      // Simulate API call with mock data for now
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockData: TelemetryReading[] = generateMockTelemetryData(startDate, endDate);
      setTelemetryData(mockData);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  // Generate mock telemetry data
  const generateMockTelemetryData = (startDate: Date, endDate: Date): TelemetryReading[] => {
    const data: TelemetryReading[] = [];
    const hours = Math.abs(endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
    const interval = Math.max(1, Math.floor(hours / 50)); // Max 50 data points

    for (let i = 0; i <= hours; i += interval) {
      const timestamp = new Date(startDate.getTime() + i * 60 * 60 * 1000).toISOString();

      // Generate realistic vital signs with some variation
      data.push(
        {
          timestamp,
          metric: 'heartRate',
          value: Math.floor(65 + Math.random() * 20 + Math.sin(i / 24) * 5),
          unit: 'bpm',
        },
        {
          timestamp,
          metric: 'bloodPressure',
          value: `${Math.floor(110 + Math.random() * 20)}/${Math.floor(70 + Math.random() * 15)}`,
          unit: 'mmHg',
        },
        {
          timestamp,
          metric: 'oxygenSaturation',
          value: Math.floor(96 + Math.random() * 4),
          unit: '%',
        }
      );
    }

    return data;
  };

  // Analyze telemetry data
  const analyzeTelemetryData = async () => {
    try {
      setAnalyzing(true);
      setError(null);

      // Simulate AI analysis API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockAnalysis: AnalysisResult = {
        success: true,
        deviceId: 'device123',
        patientId: user?.id || 'patient123',
        metrics: {
          heartRate: {
            average: 72.4,
            min: 68,
            max: 76,
            trend: 'stable',
          },
          bloodPressure: {
            systolicAverage: 120.1,
            diastolicAverage: 80.1,
            average: 120.1,
            min: 110,
            max: 130,
            trend: 'stable',
          },
          oxygenSaturation: {
            average: 98,
            min: 97,
            max: 99,
            trend: 'stable',
          },
        },
        insights: [
          "All vital signs are within normal ranges.",
          "Heart rate has remained stable over the past week.",
          "Blood pressure readings show good control.",
          "Oxygen saturation levels are excellent."
        ],
        riskScore: 0.2,
        recommendations: [
          "Continue current monitoring schedule.",
          "Maintain current medication regimen.",
          "Regular exercise is recommended."
        ]
      };

      setAnalysisResult(mockAnalysis);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle metric checkbox changes
  const handleMetricToggle = (metric: string) => {
    setSelectedMetrics(prev => ({
      ...prev,
      [metric]: !prev[metric as keyof typeof prev],
    }));
  };

  // Handle time range changes
  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range);
    loadTelemetryData(range);
  };

  // Toggle real-time updates
  const toggleRealTime = () => {
    setRealTimeEnabled(!realTimeEnabled);
  };

  // Real-time polling effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (realTimeEnabled) {
      interval = setInterval(() => {
        loadTelemetryData();
      }, 60000); // Poll every minute
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [realTimeEnabled, loadTelemetryData]);

  // Initial data load
  useEffect(() => {
    loadTelemetryData();
  }, [loadTelemetryData]);

  // Prepare chart data
  const chartData = React.useMemo(() => {
    const groupedData: Record<string, any> = {};

    telemetryData.forEach(reading => {
      const time = format(new Date(reading.timestamp), 'MMM dd HH:mm');

      if (!groupedData[time]) {
        groupedData[time] = { time, timestamp: reading.timestamp };
      }

      if (reading.metric === 'bloodPressure' && typeof reading.value === 'string') {
        const [systolic, diastolic] = reading.value.split('/').map(Number);
        groupedData[time].bloodPressureSystolic = systolic;
        groupedData[time].bloodPressureDiastolic = diastolic;
      } else {
        groupedData[time][reading.metric] = Number(reading.value);
      }
    });

    return Object.values(groupedData).sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [telemetryData]);

  if (loading && telemetryData.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Health Monitoring
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress size={50} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading telemetry data...
          </Typography>
        </Container>
      </Box>
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
          <MonitorHeart sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Health Monitoring
          </Typography>
          <Button
            variant="outlined"
            onClick={toggleRealTime}
            startIcon={realTimeEnabled ? <Stop /> : <PlayArrow />}
            sx={{ color: 'white', borderColor: 'white' }}
          >
            Real-time: {realTimeEnabled ? 'ON' : 'OFF'}
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Controls */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Time Range
              </Typography>
              <ButtonGroup variant="outlined" size="small">
                <Button
                  onClick={() => handleTimeRangeChange('24h')}
                  variant={timeRange === '24h' ? 'contained' : 'outlined'}
                >
                  24 Hours
                </Button>
                <Button
                  onClick={() => handleTimeRangeChange('7d')}
                  variant={timeRange === '7d' ? 'contained' : 'outlined'}
                >
                  7 Days
                </Button>
                <Button
                  onClick={() => handleTimeRangeChange('30d')}
                  variant={timeRange === '30d' ? 'contained' : 'outlined'}
                >
                  30 Days
                </Button>
                <Button
                  onClick={() => handleTimeRangeChange('90d')}
                  variant={timeRange === '90d' ? 'contained' : 'outlined'}
                >
                  90 Days
                </Button>
              </ButtonGroup>
            </Paper>
          </Grid>

          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Metrics
              </Typography>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      id="metric-heartRate"
                      checked={selectedMetrics.heartRate}
                      onChange={() => handleMetricToggle('heartRate')}
                      sx={{ color: metricConfigs.heartRate.color }}
                    />
                  }
                  label="Heart Rate"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      id="metric-bloodPressure"
                      checked={selectedMetrics.bloodPressure}
                      onChange={() => handleMetricToggle('bloodPressure')}
                      sx={{ color: metricConfigs.bloodPressure.color }}
                    />
                  }
                  label="Blood Pressure"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      id="metric-oxygenSaturation"
                      checked={selectedMetrics.oxygenSaturation}
                      onChange={() => handleMetricToggle('oxygenSaturation')}
                      sx={{ color: metricConfigs.oxygenSaturation.color }}
                    />
                  }
                  label="Oxygen Saturation"
                />
              </FormGroup>
            </Paper>
          </Grid>
        </Grid>

        {/* Chart */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
              Telemetry History
            </Typography>
            <Button
              variant="contained"
              onClick={analyzeTelemetryData}
              disabled={analyzing}
              startIcon={analyzing ? <CircularProgress size={20} /> : <Analytics />}
            >
              Analyze Data
            </Button>
          </Box>

          <Box className="telemetry-chart" sx={{ height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #ccc',
                    borderRadius: '8px'
                  }}
                />
                <Legend />

                {selectedMetrics.heartRate && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="heartRate"
                      stroke={metricConfigs.heartRate.color}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Heart Rate (bpm)"
                    />
                    <ReferenceLine y={60} stroke="#ff6b6b" strokeDasharray="2 2" strokeOpacity={0.5} />
                    <ReferenceLine y={100} stroke="#ff6b6b" strokeDasharray="2 2" strokeOpacity={0.5} />
                  </>
                )}

                {selectedMetrics.bloodPressure && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="bloodPressureSystolic"
                      stroke={metricConfigs.bloodPressure.color}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Systolic BP (mmHg)"
                    />
                    <Line
                      type="monotone"
                      dataKey="bloodPressureDiastolic"
                      stroke={metricConfigs.bloodPressure.color}
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3 }}
                      name="Diastolic BP (mmHg)"
                    />
                  </>
                )}

                {selectedMetrics.oxygenSaturation && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="oxygenSaturation"
                      stroke={metricConfigs.oxygenSaturation.color}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Oxygen Saturation (%)"
                    />
                    <ReferenceLine y={95} stroke="#45b7d1" strokeDasharray="2 2" strokeOpacity={0.5} />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="analysis-results">
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                <Psychology sx={{ mr: 1, verticalAlign: 'middle' }} />
                AI Analysis Results
              </Typography>

              {/* Metrics Summary */}
              <div className="metrics-summary">
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" color="primary">
                          Heart Rate: {analysisResult.metrics.heartRate.average} bpm
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Range: {analysisResult.metrics.heartRate.min} - {analysisResult.metrics.heartRate.max} bpm
                        </Typography>
                        <Chip
                          size="small"
                          label={analysisResult.metrics.heartRate.trend}
                          color={analysisResult.metrics.heartRate.trend === 'stable' ? 'success' : 'warning'}
                          icon={analysisResult.metrics.heartRate.trend === 'stable' ? <FiberManualRecord /> : <TrendingUp />}
                        />
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" color="primary">
                          Blood Pressure: {analysisResult.metrics.bloodPressure.systolicAverage}/{analysisResult.metrics.bloodPressure.diastolicAverage} mmHg
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Trend: {analysisResult.metrics.bloodPressure.trend}
                        </Typography>
                        <Chip
                          size="small"
                          label={analysisResult.metrics.bloodPressure.trend}
                          color="success"
                          icon={<CheckCircle />}
                        />
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" color="primary">
                          Oxygen Saturation: {analysisResult.metrics.oxygenSaturation.average}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Range: {analysisResult.metrics.oxygenSaturation.min} - {analysisResult.metrics.oxygenSaturation.max}%
                        </Typography>
                        <Chip
                          size="small"
                          label="Excellent"
                          color="success"
                          icon={<CheckCircle />}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </div>

              <Divider sx={{ my: 3 }} />

              {/* Insights */}
              <div className="insights-section">
                <Typography variant="h6" gutterBottom>
                  Health Insights
                </Typography>
                <List>
                  {analysisResult.insights.map((insight, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText primary={insight} />
                    </ListItem>
                  ))}
                </List>
              </div>

              <Divider sx={{ my: 3 }} />

              {/* Recommendations */}
              <div className="recommendations-section">
                <Typography variant="h6" gutterBottom>
                  Recommendations
                </Typography>
                <List>
                  {analysisResult.recommendations.map((recommendation, index) => (
                    <ListItem key={index}>
                      <ListItemIcon>
                        <TrendingUp color="primary" />
                      </ListItemIcon>
                      <ListItemText primary={recommendation} />
                    </ListItem>
                  ))}
                </List>
              </div>

              {/* Risk Score */}
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Risk Assessment
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body1">Risk Score:</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={analysisResult.riskScore * 100}
                    sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
                    color={analysisResult.riskScore < 0.3 ? 'success' : analysisResult.riskScore < 0.7 ? 'warning' : 'error'}
                  />
                  <Typography variant="body1" fontWeight="bold">
                    {(analysisResult.riskScore * 100).toFixed(1)}%
                  </Typography>
                  <Chip
                    label={analysisResult.riskScore < 0.3 ? 'Low Risk' : analysisResult.riskScore < 0.7 ? 'Medium Risk' : 'High Risk'}
                    color={analysisResult.riskScore < 0.3 ? 'success' : analysisResult.riskScore < 0.7 ? 'warning' : 'error'}
                    size="small"
                  />
                </Box>
              </Box>
            </Paper>
          </div>
        )}

        {/* Real-time Status */}
        {realTimeEnabled && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FiberManualRecord sx={{ mr: 1, animation: 'pulse 2s infinite' }} />
              Real-time monitoring is active. Data updates every minute.
            </Box>
          </Alert>
        )}
      </Container>
    </Box>
  );
};

export default TelemetryPage;
