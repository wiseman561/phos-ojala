import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Divider,
  Tooltip,
  IconButton,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import theme from '../../theme';

/**
 * HealthScoreCard Component
 *
 * Displays a patient's health score with trend information,
 * category breakdowns, and recommendations for the RN dashboard.
 *
 * @param {Object} props
 * @param {Object} props.healthScore - Health score data object
 * @param {Object} props.patient - Patient data object
 * @param {Function} props.onMoreClick - Function to call when more options button is clicked
 */
const HealthScoreCard = ({
  healthScore,
  patient,
  onMoreClick
}) => {
  // Helper function to determine health score color
  const getHealthScoreColor = (score) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Helper function to determine risk level text and color
  const getRiskLevelInfo = (riskLevel) => {
    switch(riskLevel) {
      case 'low':
        return { text: 'Low Risk', color: theme.palette.success.main };
      case 'moderate':
        return { text: 'Moderate Risk', color: theme.palette.warning.main };
      case 'high':
        return { text: 'High Risk', color: theme.palette.error.light };
      case 'critical':
        return { text: 'Critical Risk', color: theme.palette.error.main };
      default:
        return { text: 'Unknown', color: theme.palette.grey[500] };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Health Score</Typography>

          <Box display="flex" alignItems="center">
            <Typography variant="body2" color="textSecondary" mr={1}>
              Last updated: {formatDate(healthScore.timestamp)}
            </Typography>

            <Tooltip title="More Options">
              <IconButton
                size="small"
                onClick={(e) => onMoreClick(e.currentTarget)}
              >
                <MoreVertIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Overall Score */}
          <Grid item xs={12} md={4}>
            <Box display="flex" flexDirection="column" alignItems="center">
              <ScoreCircle
                score={healthScore.overallScore}
                color={getHealthScoreColor(healthScore.overallScore)}
              />

              <Box mt={1} textAlign="center">
                <Typography variant="body1" fontWeight="bold">
                  {getRiskLevelInfo(healthScore.riskLevel).text}
                </Typography>

                <Box display="flex" alignItems="center" justifyContent="center" mt={0.5}>
                  {healthScore.trend > 0 ? (
                    <>
                      <TrendingUpIcon
                        fontSize="small"
                        sx={{ color: theme.palette.success.main, mr: 0.5 }}
                      />
                      <Typography
                        variant="body2"
                        color="success.main"
                      >
                        +{healthScore.trend}% from previous
                      </Typography>
                    </>
                  ) : healthScore.trend < 0 ? (
                    <>
                      <TrendingDownIcon
                        fontSize="small"
                        sx={{ color: theme.palette.error.main, mr: 0.5 }}
                      />
                      <Typography
                        variant="body2"
                        color="error.main"
                      >
                        {healthScore.trend}% from previous
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No change from previous
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Category Scores */}
          <Grid item xs={12} md={8}>
            <Typography variant="subtitle2" gutterBottom>
              Category Breakdown
            </Typography>

            <Grid container spacing={2}>
              {Object.entries(healthScore.categoryScores).map(([category, data]) => (
                <Grid item xs={6} key={category}>
                  <CategoryScoreItem
                    category={formatCategoryName(category)}
                    score={data.score}
                    riskLevel={data.riskLevel}
                    trend={data.trend}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* Divider */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
          </Grid>

          {/* Anomalies and Recommendations */}
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Detected Anomalies
            </Typography>

            {healthScore.anomalies && healthScore.anomalies.length > 0 ? (
              <Box>
                {healthScore.anomalies.slice(0, 3).map((anomaly, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 1,
                      mb: 1,
                      backgroundColor: theme.palette.error.light + '20',
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="body2" fontWeight="medium">
                      {anomaly.vitalType}: {anomaly.value} {anomaly.expectedRange ? `(Expected: ${anomaly.expectedRange.min}-${anomaly.expectedRange.max})` : ''}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {anomaly.description}
                    </Typography>
                  </Box>
                ))}

                {healthScore.anomalies.length > 3 && (
                  <Typography variant="body2" color="primary">
                    +{healthScore.anomalies.length - 3} more anomalies
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No anomalies detected
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="subtitle2" gutterBottom>
              Recommendations
            </Typography>

            {healthScore.recommendations && healthScore.recommendations.length > 0 ? (
              <Box>
                {healthScore.recommendations.slice(0, 3).map((recommendation, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 1,
                      mb: 1,
                      backgroundColor: getPriorityColor(recommendation.priority) + '20',
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="body2" fontWeight="medium">
                      {recommendation.description}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      Priority: {formatPriority(recommendation.priority)}
                    </Typography>
                  </Box>
                ))}

                {healthScore.recommendations.length > 3 && (
                  <Typography variant="body2" color="primary">
                    +{healthScore.recommendations.length - 3} more recommendations
                  </Typography>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No recommendations at this time
              </Typography>
            )}
          </Grid>

          {/* AI Explanation */}
          <Grid item xs={12}>
            <Box
              sx={{
                p: 1.5,
                backgroundColor: theme.palette.info.light + '20',
                borderRadius: 1,
                display: 'flex'
              }}
            >
              <InfoIcon sx={{ color: theme.palette.info.main, mr: 1 }} />
              <Box>
                <Typography variant="subtitle2">
                  AI Explanation
                </Typography>
                <Typography variant="body2">
                  {healthScore.aiExplanation}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// Helper Components
const ScoreCircle = ({ score, color }) => (
  <Box position="relative" display="inline-flex">
    <CircularProgress
      variant="determinate"
      value={score}
      size={120}
      thickness={5}
      sx={{
        color,
        circle: {
          strokeLinecap: 'round',
        },
      }}
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
      <Typography variant="h4" component="div" color={color} fontWeight="bold">
        {score}
      </Typography>
    </Box>
  </Box>
);

const CategoryScoreItem = ({ category, score, riskLevel, trend }) => {
  const riskColor = getRiskLevelColor(riskLevel);

  return (
    <Box mb={1}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2">{category}</Typography>
        <Box display="flex" alignItems="center">
          <Typography variant="body2" fontWeight="bold" mr={0.5}>
            {score}
          </Typography>
          {trend !== 'stable' && (
            trend === 'improving' ? (
              <TrendingUpIcon fontSize="small" sx={{ color: theme.palette.success.main }} />
            ) : (
              <TrendingDownIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
            )
          )}
        </Box>
      </Box>
      <LinearProgressStyled value={score} riskColor={riskColor} />
    </Box>
  );
};

// Styled Components
const LinearProgressStyled = styled('div')(({ theme, value, riskColor }) => ({
  height: 6,
  borderRadius: 3,
  width: '100%',
  backgroundColor: theme.palette.grey[200],
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: `${value}%`,
    height: '100%',
    backgroundColor: riskColor,
    borderRadius: 3,
  }
}));

// Helper Functions
const formatCategoryName = (category) => {
  return category
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase());
};

const getRiskLevelColor = (riskLevel) => {
  switch(riskLevel) {
    case 'low':
      return theme.palette.success.main;
    case 'moderate':
      return theme.palette.warning.main;
    case 'high':
      return theme.palette.error.light;
    case 'critical':
      return theme.palette.error.main;
    default:
      return theme.palette.grey[500];
  }
};

const getPriorityColor = (priority) => {
  switch(priority) {
    case 'high':
    case 'urgent':
      return theme.palette.error.main;
    case 'medium':
      return theme.palette.warning.main;
    case 'low':
      return theme.palette.info.main;
    default:
      return theme.palette.grey[500];
  }
};

const formatPriority = (priority) => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

export default HealthScoreCard;
