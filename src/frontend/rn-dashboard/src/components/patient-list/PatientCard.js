import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Avatar, Chip, LinearProgress, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { MoreVert, Notifications, Message, VideoCall } from '@mui/icons-material';
import theme from '../../theme';

// Helper function to get alert severity color
const getAlertSeverityColor = (severity) => {
  switch(severity) {
    case 'critical':
      return theme.palette.error.main;
    case 'urgent':
      return theme.palette.error.light;
    case 'warning':
      return theme.palette.warning.main;
    case 'info':
    default:
      return theme.palette.info.main;
  }
};

/**
 * PatientCard Component
 *
 * Displays a summary of patient information for the RN dashboard
 * with health score, alerts, and quick action buttons.
 *
 * @param {Object} props
 * @param {Object} props.patient - Patient data object
 * @param {Function} props.onPatientClick - Function to call when card is clicked
 * @param {Function} props.onMessageClick - Function to call when message button is clicked
 * @param {Function} props.onTelehealthClick - Function to call when telehealth button is clicked
 * @param {Function} props.onMoreClick - Function to call when more options button is clicked
 */
const PatientCard = ({
  patient,
  onPatientClick,
  onMessageClick,
  onTelehealthClick,
  onMoreClick
}) => {
  // Helper function to determine health score color
  const getHealthScoreColor = (score) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  // Helper function to format date of birth to age
  const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  return (
    <StyledCard onClick={onPatientClick}>
      <CardContent>
        <Grid container spacing={2}>
          {/* Patient Basic Info */}
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center">
              <StyledAvatar
                src={patient.profileImage}
                alt={`${patient.firstName} ${patient.lastName}`}
              >
                {patient.firstName[0]}{patient.lastName[0]}
              </StyledAvatar>

              <Box ml={2}>
                <Typography variant="h6" component="div">
                  {patient.firstName} {patient.lastName}
                </Typography>

                <Typography variant="body2" color="textSecondary">
                  {patient.gender}, {calculateAge(patient.dateOfBirth)} years • ID: {patient.patientId}
                </Typography>

                <Box display="flex" alignItems="center" mt={1}>
                  {patient.conditions.map((condition, index) => (
                    <Chip
                      key={index}
                      label={condition}
                      size="small"
                      variant="outlined"
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Health Score */}
          <Grid item xs={12} sm={3}>
            <Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Health Score
              </Typography>

              <Box display="flex" alignItems="center">
                <HealthScoreCircle
                  score={patient.healthScore.current}
                  color={getHealthScoreColor(patient.healthScore.current)}
                />

                <Box ml={1}>
                  <Typography variant="body2" color="textSecondary">
                    Trend: {patient.healthScore.trend > 0 ? '+' : ''}{patient.healthScore.trend}%
                  </Typography>

                  <Typography variant="body2" color="textSecondary">
                    Last updated: {new Date(patient.healthScore.lastUpdated).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Grid>

          {/* Alerts */}
          <Grid item xs={12} sm={3}>
            <Box>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Alerts ({patient.alerts.length})
              </Typography>

              {patient.alerts.length > 0 ? (
                <Box>
                  {patient.alerts.slice(0, 2).map((alert, index) => (
                    <Box key={index} display="flex" alignItems="center" mb={1}>
                      <AlertDot severity={alert.severity} />
                      <Tooltip title={alert.description}>
                        <Typography variant="body2" noWrap sx={{ maxWidth: '200px' }}>
                          {alert.title}
                        </Typography>
                      </Tooltip>
                    </Box>
                  ))}

                  {patient.alerts.length > 2 && (
                    <Typography variant="body2" color="primary">
                      +{patient.alerts.length - 2} more
                    </Typography>
                  )}
                </Box>
              ) : (
                <Typography variant="body2">No active alerts</Typography>
              )}
            </Box>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
              <Box>
                <Chip
                  label={patient.careProgram}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={patient.riskLevel}
                  size="small"
                  color={
                    patient.riskLevel === 'High' ? 'error' :
                    patient.riskLevel === 'Moderate' ? 'warning' : 'success'
                  }
                  sx={{ ml: 1 }}
                />
              </Box>

              <Box>
                <ActionButton
                  icon={<Message />}
                  label="Message"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMessageClick(patient.id);
                  }}
                />

                <ActionButton
                  icon={<VideoCall />}
                  label="Telehealth"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTelehealthClick(patient.id);
                  }}
                />

                <ActionButton
                  icon={<MoreVert />}
                  label="More"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoreClick(patient.id, e.currentTarget);
                  }}
                />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>

      {/* Medication Adherence Indicator */}
      <Box px={2} pb={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
          <Typography variant="caption" color="textSecondary">
            Medication Adherence
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {patient.medicationAdherence}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={patient.medicationAdherence}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: theme.palette.grey[200],
            '& .MuiLinearProgress-bar': {
              borderRadius: 3,
              backgroundColor:
                patient.medicationAdherence >= 80 ? theme.palette.success.main :
                patient.medicationAdherence >= 50 ? theme.palette.warning.main :
                theme.palette.error.main
            }
          }}
        />
      </Box>
    </StyledCard>
  );
};

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  width: 56,
  height: 56,
  backgroundColor: theme.palette.primary.main,
}));

const HealthScoreCircle = ({ score, color }) => (
  <Box
    sx={{
      width: 56,
      height: 56,
      borderRadius: '50%',
      border: `3px solid ${color}`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <Typography variant="h6" component="div" sx={{ color }}>
      {score}
    </Typography>
  </Box>
);

const AlertDot = ({ severity }) => (
  <Box
    sx={{
      width: 10,
      height: 10,
      borderRadius: '50%',
      backgroundColor: getAlertSeverityColor(severity),
      marginRight: 1,
    }}
  />
);

const ActionButton = ({ icon, label, onClick }) => (
  <Tooltip title={label}>
    <Box
      component="button"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        borderRadius: '50%',
        border: 'none',
        backgroundColor: 'transparent',
        color: theme.palette.text.secondary,
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        marginLeft: 1,
        '&:hover': {
          backgroundColor: theme.palette.action.hover,
          color: theme.palette.primary.main,
        },
      }}
      onClick={onClick}
    >
      {icon}
    </Box>
  </Tooltip>
);

export default PatientCard;
