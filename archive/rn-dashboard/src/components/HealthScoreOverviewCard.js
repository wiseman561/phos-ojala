import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Tooltip,
  IconButton,
  LinearProgress,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
  MoreVert as MoreVertIcon,
  GetApp as DownloadIcon
} from '@mui/icons-material';
import theme from '../theme';

// Helper Functions
const getTrendDisplay = (trend) => {
  if (trend > 0) {
    return { color: theme.palette.success.main, icon: <TrendingUpIcon fontSize="small" /> };
  }
  if (trend < 0) {
    return { color: theme.palette.error.main, icon: <TrendingDownIcon fontSize="small" /> };
  }
  return { color: theme.palette.text.secondary, icon: null };
};

const getRiskLevelColor = (riskLevel) => {
  switch (riskLevel.toLowerCase()) {
    case 'high': return theme.palette.error.main;
    case 'moderate': return theme.palette.warning.main;
    case 'low': return theme.palette.success.main;
    default: return theme.palette.grey[500];
  }
};

const getScoreColor = (score) => {
  if (score >= 80) return theme.palette.success.main;
  if (score >= 60) return theme.palette.warning.main;
  return theme.palette.error.main;
};

// Styled Component for circular chart
const CircularProgressStyled = styled('div')(({ value, theme, color }) => ({
  position: 'relative',
  width: 120,
  height: 120,
  borderRadius: '50%',
  background: `conic-gradient(${color} ${value}%, ${theme.palette.grey[200]} 0%)`,
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '80%',
    height: '80%',
    borderRadius: '50%',
    background: theme.palette.background.paper
  }
}));

const HealthScoreOverviewCard = ({ healthScoreData, onDownloadClick, onMoreClick }) => {
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Population Health Score</Typography>
          <Box>
            <Tooltip title="Download Data">
              <IconButton size="small" onClick={onDownloadClick} sx={{ mr: 1 }}>
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="More Options">
              <IconButton size="small" onClick={onMoreClick}>
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" color="textSecondary">
            Last updated: {formatDate(healthScoreData.lastUpdated)}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Total employees: {healthScoreData.totalEmployees}
          </Typography>
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Box display="flex" flexDirection="column" alignItems="center" p={2}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Average Health Score
              </Typography>
              <Box position="relative" display="inline-flex">
                <CircularProgressStyled
                  value={healthScoreData.averageScore}
                  color={getScoreColor(healthScoreData.averageScore)}
                />
                <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="h3" component="div" fontWeight="bold" sx={{ color: getScoreColor(healthScoreData.averageScore) }}>
                    {healthScoreData.averageScore}
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" alignItems="center" mt={1}>
                {getTrendDisplay(healthScoreData.trend).icon}
                <Typography variant="body2" sx={{ color: getTrendDisplay(healthScoreData.trend).color, ml: 0.5 }}>
                  {healthScoreData.trend > 0 ? '+' : ''}{healthScoreData.trend}%
                </Typography>
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box p={2}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Risk Level Distribution
              </Typography>
              {Object.entries(healthScoreData.riskDistribution).map(([level, percentage]) => (
                <Box key={level} mb={1.5}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2">{`${level.charAt(0).toUpperCase()}${level.slice(1)} Risk`}</Typography>
                    <Typography variant="body2" fontWeight="medium">{`${percentage}%`}</Typography>
                  </Box>
                  <LinearProgress variant="determinate" value={percentage} sx={{ height: 8, borderRadius: 4, backgroundColor: theme.palette.grey[200], '& .MuiLinearProgress-bar': { borderRadius: 4, backgroundColor: getRiskLevelColor(level) } }} />
                </Box>
              ))}
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box p={2}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Key Metrics
              </Typography>
              {Object.entries(healthScoreData.keyMetrics).map(([label, { value, trend }]) => (
                <MetricItem key={label} label={label} value={value} trend={trend} />
              ))}
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

const MetricItem = ({ label, value, trend }) => {
  const { color, icon } = getTrendDisplay(trend);
  return (
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
      <Typography variant="body2">{label}</Typography>
      <Box display="flex" alignItems="center">
        <Typography variant="body1" fontWeight="medium" mr={1}>{value}</Typography>
        {icon && <Box display="flex" alignItems="center" sx={{ color }}><>{icon}</><Typography variant="caption" sx={{ ml: 0.5 }}>{`${Math.abs(trend)}%`}</Typography></Box>}
      </Box>
    </Box>
  );
};

export default HealthScoreOverviewCard;
