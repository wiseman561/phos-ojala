import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

/**
 * CarePlanApprovalModal Component (Web Stub)
 *
 * Minimal web-compatible version of the CarePlanApprovalModal component
 */
const CarePlanApprovalModal = ({ open, onClose, patient, onApprove, onSendBack }) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Care Plan Approval</DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          Care plan for {patient ? patient.name : 'Patient'} is ready for review.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={() => onSendBack(patient?.id, 'Needs revision')} color="warning">
          Send Back
        </Button>
        <Button onClick={() => onApprove(patient?.id, 'Approved')} color="primary" variant="contained">
          Approve
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CarePlanApprovalModal;
