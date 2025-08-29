import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { useEscalatedAlerts } from '../../hooks/useEscalatedAlerts';

/**
 * RNAlertManager Component
 *
 * Allows RNs to escalate alerts to MDs for review
 */
const RNAlertManager = ({ patient, onClose }) => {
  const { addAlert } = useEscalatedAlerts();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [error, setError] = useState('');

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setMessage('');
    setPriority('medium');
    setError('');
    onClose?.();
  };

  const handleEscalate = () => {
    if (!message.trim()) {
      setError('Please provide a message');
      return;
    }

    const alert = {
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      message: message.trim(),
      severity: priority,
      metric: patient.metric,
      value: patient.value,
      escalatedBy: 'RN' // In a real app, this would come from the auth context
    };

    addAlert(alert);
    handleClose();
  };

  return (
    <>
      <Button
        variant="contained"
        color="warning"
        onClick={handleOpen}
        startIcon={<WarningIcon />}
      >
        Escalate to MD
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Escalate Alert to MD</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Patient Information
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Chip
                label={`${patient.firstName} ${patient.lastName}`}
                sx={{ mr: 1 }}
              />
              <Chip
                label={`ID: ${patient.id}`}
                variant="outlined"
                sx={{ mr: 1 }}
              />
              {patient.metric && (
                <Chip
                  label={`${patient.metric}: ${patient.value}`}
                  color="warning"
                />
              )}
            </Box>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Priority Level</InputLabel>
              <Select
                value={priority}
                label="Priority Level"
                onChange={(e) => setPriority(e.target.value)}
              >
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Alert Message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              error={!!error}
              helperText="Describe the reason for escalation"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleEscalate}
          >
            Escalate
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default RNAlertManager;
