import React from 'react';
import { Box, Chip, Typography } from '@mui/material';

/**
 * ConditionFilterBar Component (Web Stub)
 *
 * Minimal web-compatible version of the ConditionFilterBar component
 */
const ConditionFilterBar = ({ onFilterChange }) => {
  const conditions = ['Hypertension', 'Diabetes', 'Asthma', 'Heart Disease'];
  const [selectedConditions, setSelectedConditions] = React.useState([]);

  const handleFilterToggle = (condition) => {
    const newConditions = selectedConditions.includes(condition)
      ? selectedConditions.filter(c => c !== condition)
      : [...selectedConditions, condition];

    setSelectedConditions(newConditions);
    onFilterChange(newConditions);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Typography variant="h6" gutterBottom>
        Filter by Condition
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {conditions.map((condition) => (
          <Chip
            key={condition}
            label={condition}
            onClick={() => handleFilterToggle(condition)}
            color={selectedConditions.includes(condition) ? 'primary' : 'default'}
            variant={selectedConditions.includes(condition) ? 'filled' : 'outlined'}
          />
        ))}
      </Box>
    </Box>
  );
};

export default ConditionFilterBar;
