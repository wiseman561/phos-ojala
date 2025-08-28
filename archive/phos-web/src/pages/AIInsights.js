import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Tabs, Tab, Card, CardContent, CardHeader, Divider, List, ListItem, ListItemText, ListItemIcon, Chip } from '@mui/material';
import { Warning as WarningIcon, CheckCircle as CheckCircleIcon, Timeline as TimelineIcon } from '@mui/icons-material';
import axios from 'axios';

const AIInsights = () => {
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [healthScoreData, setHealthScoreData] = useState(null);
  const [riskAssessments, setRiskAssessments] = useState([]);
  const [forecasts, setForecasts] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real implementation, these would be actual API calls
        // For now, we'll simulate the data loading
        setTimeout(() => {
          setHealthScoreData({
            score: 78,
            components: [
              { name: 'Lifestyle', value: 82, weight: 0.3, description: 'Diet and exercise habits' },
              { name: 'Vitals', value: 75, weight: 0.4, description: 'Blood pressure, heart rate, etc.' },
              { name: 'Medical History', value: 68, weight: 0.2, description: 'Past conditions and treatments' },
              { name: 'Compliance', value: 90, weight: 0.1, description: 'Medication and appointment adherence' }
            ],
            recommendation: 'Consider increasing physical activity to improve overall health score.'
          });

          setRiskAssessments([
            { 
              riskLevel: 'Medium',
              riskScore: 65,
              riskFactors: [
                { name: 'Hypertension', contribution: 0.4, description: 'Blood pressure consistently above normal range', isModifiable: true },
                { name: 'Family History', contribution: 0.3, description: 'First-degree relatives with cardiovascular disease', isModifiable: false },
                { name: 'Sedentary Lifestyle', contribution: 0.2, description: 'Less than recommended physical activity', isModifiable: true },
                { name: 'Diet', contribution: 0.1, description: 'High sodium and processed food intake', isModifiable: true }
              ]
            }
          ]);

          setForecasts([
            {
              forecastDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
              metrics: [
                { metricName: 'Blood Pressure', currentValue: 138, predictedValue: 132, confidenceInterval: 5, trend: 'Improving' },
                { metricName: 'Cholesterol', currentValue: 210, predictedValue: 195, confidenceInterval: 10, trend: 'Improving' },
                { metricName: 'Blood Glucose', currentValue: 105, predictedValue: 102, confidenceInterval: 3, trend: 'Stable' },
                { metricName: 'BMI', currentValue: 27.5, predictedValue: 26.8, confidenceInterval: 0.5, trend: 'Improving' }
              ]
            }
          ]);

          setLoading(false);
        }, 1500);
      } catch (error) {
        console.error('Error fetching AI insights:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'warning.main';
    return 'error.main';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>Loading AI Insights...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>AI Insights</Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Advanced health analytics powered by our AI Engine to provide personalized insights and recommendations.
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="ai insights tabs">
          <Tab label="Health Score" />
          <Tab label="Risk Assessment" />
          <Tab label="Health Forecast" />
        </Tabs>
      </Box>

      {/* Health Score Tab */}
      {tabValue === 0 && healthScoreData && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center', height: '100%' }}>
              <Typography variant="h6" gutterBottom>Overall Health Score</Typography>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={healthScoreData.score}
                  size={160}
                  thickness={5}
                  sx={{ color: getScoreColor(healthScoreData.score) }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h3" component="div" color={getScoreColor(healthScoreData.score)}>
                    {healthScoreData.score}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body1" sx={{ mt: 2 }}>
                {healthScoreData.score >= 80 ? 'Excellent' : 
                 healthScoreData.score >= 60 ? 'Good' : 'Needs Improvement'}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom>Score Components</Typography>
              <List>
                {healthScoreData.components.map((component, index) => (
                  <ListItem key={index} divider={index < healthScoreData.components.length - 1}>
                    <ListItemText 
                      primary={component.name} 
                      secondary={`${component.description} (Weight: ${component.weight * 100}%)`} 
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body1" sx={{ mr: 2, color: getScoreColor(component.value) }}>
                        {component.value}
                      </Typography>
                      <Box sx={{ width: 100 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={component.value} 
                          sx={{ 
                            height: 8, 
                            borderRadius: 5,
                            backgroundColor: 'grey.300',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: getScoreColor(component.value),
                            }
                          }} 
                        />
                      </Box>
                    </Box>
                  </ListItem>
                ))}
              </List>
              <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="subtitle1">Recommendation</Typography>
                <Typography variant="body2">{healthScoreData.recommendation}</Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Risk Assessment Tab */}
      {tabValue === 1 && riskAssessments.length > 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>Risk Level</Typography>
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', my: 3 }}>
                <WarningIcon sx={{ 
                  fontSize: 60, 
                  color: riskAssessments[0].riskLevel === 'High' ? 'error.main' : 
                          riskAssessments[0].riskLevel === 'Medium' ? 'warning.main' : 'success.main'
                }} />
                <Typography variant="h4" sx={{ 
                  ml: 2,
                  color: riskAssessments[0].riskLevel === 'High' ? 'error.main' : 
                         riskAssessments[0].riskLevel === 'Medium' ? 'warning.main' : 'success.main'
                }}>
                  {riskAssessments[0].riskLevel}
                </Typography>
              </Box>
              <Typography variant="body1">
                Risk Score: {riskAssessments[0].riskScore}/100
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Risk Factors</Typography>
              <List>
                {riskAssessments[0].riskFactors.map((factor, index) => (
                  <ListItem key={index} divider={index < riskAssessments[0].riskFactors.length - 1}>
                    <ListItemIcon>
                      {factor.isModifiable ? 
                        <CheckCircleIcon color="success" /> : 
                        <TimelineIcon color="primary" />
                      }
                    </ListItemIcon>
                    <ListItemText 
                      primary={factor.name} 
                      secondary={factor.description} 
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip 
                        label={`${Math.round(factor.contribution * 100)}%`} 
                        color={factor.contribution > 0.3 ? "warning" : "default"}
                        size="small"
                      />
                      <Chip 
                        label={factor.isModifiable ? "Modifiable" : "Non-modifiable"} 
                        color={factor.isModifiable ? "success" : "primary"}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Health Forecast Tab */}
      {tabValue === 2 && forecasts.length > 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                90-Day Health Forecast
                <Typography variant="subtitle2" component="span" color="text.secondary" sx={{ ml: 2 }}>
                  Projected for {new Date(forecasts[0].forecastDate).toLocaleDateString()}
                </Typography>
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={3}>
                {forecasts[0].metrics.map((metric, index) => (
                  <Grid item xs={12} sm={6} md={3} key={index}>
                    <Card>
                      <CardHeader 
                        title={metric.metricName} 
                        subheader={`Trend: ${metric.trend}`}
                        titleTypographyProps={{ variant: 'subtitle1' }}
                        subheaderTypographyProps={{ 
                          variant: 'subtitle2',
                          sx: { 
                            color: metric.trend === 'Improving' ? 'success.main' : 
                                  metric.trend === 'Worsening' ? 'error.main' : 'info.main'
                          }
                        }}
                      />
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2" color="text.secondary">Current</Typography>
                          <Typography variant="body2" color="text.secondary">Predicted</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6">{metric.currentValue}</Typography>
                          <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            color: metric.predictedValue < metric.currentValue ? 'success.main' : 
                                  metric.predictedValue > metric.currentValue ? 'error.main' : 'info.main'
                          }}>
                            <Typography variant="h6">{metric.predictedValue}</Typography>
                            <Typography variant="caption" sx={{ ml: 1 }}>
                              ±{metric.confidenceInterval}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

// Missing component definition
const LinearProgress = ({ value, sx }) => {
  return (
    <Box sx={{ width: '100%', ...sx }}>
      <Box
        sx={{
          width: `${value}%`,
          height: '100%',
          borderRadius: 'inherit',
          transition: 'width 0.4s ease-in-out',
        }}
      />
    </Box>
  );
};

export default AIInsights;
