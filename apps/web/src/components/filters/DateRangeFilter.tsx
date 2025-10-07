/**
 * Date Range Filter Component
 * Story 2.3: Advanced Filtering & Cross-Filtering
 * 
 * Date range picker with calendar UI for BETWEEN operator.
 */

import React from 'react';
import { Box, TextField, Typography } from '@mui/material';

interface DateRangeFilterProps {
  value: { min: string; max: string };
  onChange: (min: string, max: string) => void;
}

/**
 * Date Range Filter Component
 */
export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ value, onChange }) => {
  const handleMinChange = (min: string) => {
    onChange(min, value.max);
  };

  const handleMaxChange = (max: string) => {
    onChange(value.min, max);
  };

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <TextField
        type="date"
        value={value.min || ''}
        onChange={(e) => handleMinChange(e.target.value)}
        size="small"
        label="From"
        InputLabelProps={{ shrink: true }}
        sx={{ flex: 1 }}
      />
      <Typography variant="body2" color="text.secondary">
        to
      </Typography>
      <TextField
        type="date"
        value={value.max || ''}
        onChange={(e) => handleMaxChange(e.target.value)}
        size="small"
        label="To"
        InputLabelProps={{ shrink: true }}
        sx={{ flex: 1 }}
      />
    </Box>
  );
};

