import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Typography, Box, Tooltip, IconButton, Button, FormControl, InputLabel, Select, MenuItem, Grid, Switch, FormControlLabel } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';

/**
 * DemoModeToggle component for enabling demo mode with sample patient data
 */
const DemoModeToggle = () => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [cohortSize, setCohortSize] = useState(50);
  const [riskDistribution, setRiskDistribution] = useState('balanced');
  const [conditionFocus, setConditionFocus] = useState('all');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  
  // Mock patient distribution data
  const patientDistribution = {
    balanced: { high: 20, moderate: 50, low: 30 },
    high_risk: { high: 60, moderate: 30, low: 10 },
    low_risk: { high: 10, moderate: 30, low: 60 }
  };
  
  // Mock condition distribution
  const conditionDistribution = {
    all: { cardiovascular: 25, metabolic: 30, respiratory: 20, mental: 15, other: 10 },
    cardiovascular: { cardiovascular: 70, metabolic: 15, respiratory: 5, mental: 5, other: 5 },
    metabolic: { cardiovascular: 15, metabolic: 70, respiratory: 5, mental: 5, other: 5 },
    respiratory: { cardiovascular: 5, metabolic: 5, respiratory: 80, mental: 5, other: 5 },
    mental: { cardiovascular: 5, metabolic: 5, respiratory: 5, mental: 80, other: 5 }
  };
  
  // Generate chart data based on selected options
  const riskData = Object.entries(patientDistribution[riskDistribution]).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    patients: Math.round(value * cohortSize / 100)
  }));
  
  const conditionData = Object.entries(conditionDistribution[conditionFocus]).map(([key, value]) => ({
    name: key.charAt(0).toUpperCase() + key.slice(1),
    percentage: value
  }));
  
  // Handle demo mode toggle
  const handleDemoModeToggle = (event) => {
    setDemoMode(event.target.checked);
    if (!event.target.checked) {
      setIsGenerated(false);
    }
  };
  
  // Handle generate sample data
  const handleGenerateSampleData = () => {
    setIsGenerating(true);
    
    // Simulate API call to generate sample data
    setTimeout(() => {
      setIsGenerating(false);
      setIsGenerated(true);
    }, 2000);
  };

  return (
    <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="Sample Patient Cohort Simulator"
        action={
          <Tooltip 
            title={
              <React.Fragment>
                <Typography variant="body2">The Sample Patient Cohort Simulator allows you to generate realistic patient data for demonstration purposes.</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>Configure the cohort size, risk distribution, and condition focus to create a tailored dataset.</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>All generated data is synthetic and does not represent real patients.</Typography>
              </React.Fragment>
            }
            arrow
            open={showTooltip}
            onClose={() => setShowTooltip(false)}
            disableFocusListener
            disableHoverListener
            disableTouchListener
          >
            <IconButton 
              aria-label="demo mode info"
              onClick={() => setShowTooltip(!showTooltip)}
            >
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={demoMode}
                onChange={handleDemoModeToggle}
                color="primary"
              />
            }
            label={
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Enable Demo Mode
              </Typography>
            }
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            When enabled, the platform will use synthetic patient data for demonstration purposes.
            All features will be fully functional with realistic, but fictional, patient information.
          </Typography>
        </Box>
        
        {demoMode && (
          <>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>
              Configure Sample Patient Cohort
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Cohort Size</InputLabel>
                  <Select
                    value={cohortSize}
                    label="Cohort Size"
                    onChange={(e) => setCohortSize(e.target.value)}
                    disabled={isGenerating || isGenerated}
                  >
                    <MenuItem value={10}>10 Patients</MenuItem>
                    <MenuItem value={50}>50 Patients</MenuItem>
                    <MenuItem value={100}>100 Patients</MenuItem>
                    <MenuItem value={250}>250 Patients</MenuItem>
                    <MenuItem value={500}>500 Patients</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Risk Distribution</InputLabel>
                  <Select
                    value={riskDistribution}
                    label="Risk Distribution"
                    onChange={(e) => setRiskDistribution(e.target.value)}
                    disabled={isGenerating || isGenerated}
                  >
                    <MenuItem value="balanced">Balanced</MenuItem>
                    <MenuItem value="high_risk">High Risk Heavy</MenuItem>
                    <MenuItem value="low_risk">Low Risk Heavy</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Condition Focus</InputLabel>
                  <Select
                    value={conditionFocus}
                    label="Condition Focus"
                    onChange={(e) => setConditionFocus(e.target.value)}
                    disabled={isGenerating || isGenerated}
                  >
                    <MenuItem value="all">All Conditions</MenuItem>
                    <MenuItem value="cardiovascular">Cardiovascular</MenuItem>
                    <MenuItem value="metabolic">Metabolic</MenuItem>
                    <MenuItem value="respiratory">Respiratory</MenuItem>
                    <MenuItem value="mental">Mental Health</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Risk Level Distribution
                </Typography>
                <Box sx={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={riskData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => [`${value} patients`, 'Count']} />
                      <Bar 
                        dataKey="patients" 
                        name="Patients"
                        fill={(entry) => {
                          switch(entry.name) {
                            case 'High': return '#f44336';
                            case 'Moderate': return '#ff9800';
                            case 'Low': return '#4caf50';
                            default: return '#2196f3';
                          }
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Condition Distribution
                </Typography>
                <Box sx={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={conditionData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                      <Bar dataKey="percentage" name="Percentage" fill="#2196f3" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
            </Grid>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<PlayCircleOutlineIcon />}
                onClick={handleGenerateSampleData}
                disabled={isGenerating || isGenerated}
                sx={{ px: 4 }}
              >
                {isGenerating ? 'Generating...' : isGenerated ? 'Generated Successfully' : 'Generate Sample Data'}
              </Button>
            </Box>
            
            {isGenerated && (
              <Box sx={{ mt: 3, p: 2, bgcolor: '#e8f5e9', borderRadius: 1 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                  Sample Data Generated Successfully
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {cohortSize} synthetic patients have been created with the following characteristics:
                </Typography>
                <ul style={{ marginTop: 8, marginBottom: 8 }}>
                  <li>
                    <Typography variant="body2">
                      Risk distribution: {riskData.map(d => `${d.name}: ${d.patients} patients`).join(', ')}
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      Primary condition focus: {conditionFocus === 'all' ? 'Balanced across all conditions' : conditionFocus.charAt(0).toUpperCase() + conditionFocus.slice(1)}
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      Data includes: Demographics, vitals, medications, lab results, health scores, and care plans
                    </Typography>
                  </li>
                </ul>
                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                  All platform features are now using this synthetic data. To return to normal operation, disable Demo Mode.
                </Typography>
              </Box>
            )}
          </>
        )}
        
        {!demoMode && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 3 }}>
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center' }}>
              Demo Mode is currently disabled. Enable it to generate and work with synthetic patient data for demonstration purposes.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
              When enabled, you can configure the patient cohort size, risk distribution, and condition focus to create a tailored dataset.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default DemoModeToggle;
