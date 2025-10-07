/**
 * Numeric Range Filter Component
 * Story 2.3: Advanced Filtering & Cross-Filtering
 * 
 * Numeric range slider with min/max inputs for BETWEEN operator.
 */

import React from 'react';
import { Box, TextField, Slider, Typography } from '@mui/material';

interface NumericRangeFilterProps {
  value: { min: number; max: number };
  onChange: (min: number, max: number) => void;
  minBound?: number;
  maxBound?: number;
}

/**
 * Numeric Range Filter Component
 */
export const NumericRangeFilter: React.FC<NumericRangeFilterProps> = ({
  value,
  onChange,
  minBound = 0,
  maxBound = 1000,
}) => {
  const [sliderValue, setSliderValue] = React.useState<number[]>([
    value.min || minBound,
    value.max || maxBound,
  ]);

  React.useEffect(() => {
    setSliderValue([value.min || minBound, value.max || maxBound]);
  }, [value.min, value.max, minBound, maxBound]);

  const handleSliderChange = (_event: Event, newValue: number | number[]) => {
    const [min, max] = newValue as number[];
    setSliderValue([min, max]);
  };

  const handleSliderCommit = (_event: Event | React.SyntheticEvent, newValue: number | number[]) => {
    const [min, max] = newValue as number[];
    onChange(min, max);
  };

  const handleMinChange = (min: number) => {
    onChange(min, value.max);
  };

  const handleMaxChange = (max: number) => {
    onChange(value.min, max);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
        <TextField
          type="number"
          value={value.min || ''}
          onChange={(e) => handleMinChange(parseFloat(e.target.value) || minBound)}
          size="small"
          label="Min"
          sx={{ flex: 1 }}
        />
        <Typography variant="body2" color="text.secondary">
          to
        </Typography>
        <TextField
          type="number"
          value={value.max || ''}
          onChange={(e) => handleMaxChange(parseFloat(e.target.value) || maxBound)}
          size="small"
          label="Max"
          sx={{ flex: 1 }}
        />
      </Box>

      <Box sx={{ px: 1 }}>
        <Slider
          value={sliderValue}
          onChange={handleSliderChange}
          onChangeCommitted={handleSliderCommit}
          valueLabelDisplay="auto"
          min={minBound}
          max={maxBound}
          disableSwap
        />
      </Box>
    </Box>
  );
};

