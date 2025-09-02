import React from 'react';
import { Card, CardContent, Typography, Box, Grid, LinearProgress } from '@mui/material';

export interface ProgramComparison {
  name: string;
  participants: number;
  completionRate: number;
  healthImprovement: number;
  costSavings: number;
}

export interface ProgramEffectivenessCardProps {
  programs: ProgramComparison[];
  onViewDetails?: (program: ProgramComparison) => void;
  className?: string;
}

const ProgramEffectivenessCard: React.FC<ProgramEffectivenessCardProps> = ({
  programs,
  onViewDetails,
  className = ''
}) => {
  const handleViewDetails = (program: ProgramComparison) => {
    if (onViewDetails) {
      onViewDetails(program);
    }
  };

  const getColorForMetric = (value: number, max: number = 100) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'warning';
    return 'error';
  };

  return (
    <Card className={`program-effectiveness-card ${className}`}>
      <CardContent>
        <Typography variant="h6" component="h2" gutterBottom>
          Program Effectiveness Comparison
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Compare the performance of different health programs across key metrics
        </Typography>

        <Grid container spacing={3}>
          {programs.map((program, index) => (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Box 
                sx={{ 
                  p: 2, 
                  border: '1px solid #e0e0e0', 
                  borderRadius: 2,
                  cursor: onViewDetails ? 'pointer' : 'default',
                  '&:hover': onViewDetails ? {
                    boxShadow: 2,
                    borderColor: 'primary.main'
                  } : {}
                }}
                onClick={() => handleViewDetails(program)}
              >
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  {program.name}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Participants: {program.participants.toLocaleString()}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Completion Rate</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {program.completionRate}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={program.completionRate} 
                    color={getColorForMetric(program.completionRate)}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Health Improvement</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {program.healthImprovement}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={program.healthImprovement} 
                    color={getColorForMetric(program.healthImprovement)}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>

                <Box sx={{ 
                  mt: 2, 
                  pt: 2, 
                  borderTop: '1px solid #f0f0f0',
                  textAlign: 'center'
                }}>
                  <Typography variant="body2" color="text.secondary">
                    Cost Savings
                  </Typography>
                  <Typography 
                    variant="h6" 
                    fontWeight="bold" 
                    color="success.main"
                  >
                    ${program.costSavings.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>

        {programs.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No program data available at this time.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgramEffectivenessCard;
