import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  LocalHospital,
  Assignment,
  CalendarToday,
  Flag
} from '@mui/icons-material';
import { Patient } from '../services/patientService';

interface CarePlanApprovalModalProps {
  open: boolean;
  onClose: () => void;
  patient: Patient | null;
  onApprove: (patientId: string, notes: string) => Promise<void>;
  onReject: (patientId: string, reason: string) => Promise<void>;
}

const CarePlanApprovalModal: React.FC<CarePlanApprovalModalProps> = ({
  open,
  onClose,
  patient,
  onApprove,
  onReject,
}) => {
  const [approvalNotes, setApprovalNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    if (!patient?.id) {
      setError('Patient ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`[CarePlanApprovalModal] Approving care plan for patient: ${patient.id}`);
      await onApprove(patient.id, approvalNotes);
      console.log(`[CarePlanApprovalModal] Successfully approved care plan for patient: ${patient.id}`);
      handleClose();
    } catch (err) {
      console.error(`[CarePlanApprovalModal] Error approving care plan:`, err);
      setError('Failed to approve care plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!patient?.id) {
      setError('Patient ID is required');
      return;
    }

    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log(`[CarePlanApprovalModal] Rejecting care plan for patient: ${patient.id}`);
      await onReject(patient.id, rejectionReason);
      console.log(`[CarePlanApprovalModal] Successfully rejected care plan for patient: ${patient.id}`);
      handleClose();
    } catch (err) {
      console.error(`[CarePlanApprovalModal] Error rejecting care plan:`, err);
      setError('Failed to reject care plan. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setApprovalNotes('');
    setRejectionReason('');
    setAction(null);
    setError(null);
    setLoading(false);
    onClose();
  };

  const patientName = patient?.name || `${patient?.firstName || 'Unknown'} ${patient?.lastName || 'Patient'}`;
  const carePlan = patient?.activePlan;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalHospital color="primary" />
          <Typography variant="h6">
            Care Plan Approval - {patientName}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Patient Information */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Patient Information
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <Assignment />
              </ListItemIcon>
              <ListItemText
                primary="Patient ID"
                secondary={patient?.id || 'Not available'}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Assignment />
              </ListItemIcon>
              <ListItemText
                primary="Name"
                secondary={patientName}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CalendarToday />
              </ListItemIcon>
              <ListItemText
                primary="Age"
                secondary={patient?.age ? `${patient.age} years` : 'Not available'}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Flag />
              </ListItemIcon>
              <ListItemText
                primary="Condition"
                secondary={patient?.condition || 'General Care'}
              />
            </ListItem>
          </List>
        </Box>

        {/* Care Plan Information */}
        {carePlan ? (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Care Plan Details
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <LocalHospital />
                </ListItemIcon>
                <ListItemText
                  primary="Plan Name"
                  secondary={carePlan.planName || 'Unnamed Plan'}
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <Assignment />
                </ListItemIcon>
                <ListItemText
                  primary="Status"
                  secondary={
                    <Chip
                      label={carePlan.status || 'Active'}
                      color="primary"
                      size="small"
                    />
                  }
                />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <CalendarToday />
                </ListItemIcon>
                <ListItemText
                  primary="Start Date"
                  secondary={carePlan.startDate ? new Date(carePlan.startDate).toLocaleDateString() : 'Not specified'}
                />
              </ListItem>
              {carePlan.endDate && (
                <ListItem>
                  <ListItemIcon>
                    <CalendarToday />
                  </ListItemIcon>
                  <ListItemText
                    primary="End Date"
                    secondary={new Date(carePlan.endDate).toLocaleDateString()}
                  />
                </ListItem>
              )}
            </List>

            {/* Care Plan Goals */}
            {carePlan.goals && carePlan.goals.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Care Plan Goals:
                </Typography>
                <List dense>
                  {carePlan.goals.map((goal, index) => (
                    <ListItem key={index}>
                      <ListItemText primary={goal} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        ) : (
          <Alert severity="info" sx={{ mb: 3 }}>
            No active care plan found for this patient.
          </Alert>
        )}

        {/* Action Selection */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Approval Decision
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Select Action</InputLabel>
            <Select
              value={action || ''}
              onChange={(e) => setAction(e.target.value as 'approve' | 'reject' | null)}
              label="Select Action"
            >
              <MenuItem value="approve">Approve Care Plan</MenuItem>
              <MenuItem value="reject">Reject Care Plan</MenuItem>
            </Select>
          </FormControl>

          {/* Approval Notes */}
          {action === 'approve' && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Approval Notes (Optional)"
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder="Add any notes or comments about the approval..."
            />
          )}

          {/* Rejection Reason */}
          {action === 'reject' && (
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Rejection Reason *"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Please provide a reason for rejecting this care plan..."
              required
            />
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancel
        </Button>
        {action === 'approve' && (
          <Button
            onClick={handleApprove}
            variant="contained"
            color="success"
            startIcon={<CheckCircle />}
            disabled={loading}
          >
            {loading ? 'Approving...' : 'Approve Care Plan'}
          </Button>
        )}
        {action === 'reject' && (
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            startIcon={<Cancel />}
            disabled={loading || !rejectionReason.trim()}
          >
            {loading ? 'Rejecting...' : 'Reject Care Plan'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CarePlanApprovalModal;
