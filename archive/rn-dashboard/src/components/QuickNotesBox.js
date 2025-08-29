import React from 'react';
import { Card, CardContent, Typography, TextField, Button, Box } from '@mui/material';

/**
 * QuickNotesBox Component (Web Stub)
 *
 * Minimal web-compatible version of the QuickNotesBox component
 */
const QuickNotesBox = ({ patientId, patientName }) => {
  const [note, setNote] = React.useState('');

  const handleSaveNote = () => {
    console.log('Saving note for patient:', patientId, note);
    setNote('');
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Quick Notes - {patientName}
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Enter clinical notes..."
          variant="outlined"
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveNote}
            disabled={!note.trim()}
          >
            Save Note
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default QuickNotesBox;
