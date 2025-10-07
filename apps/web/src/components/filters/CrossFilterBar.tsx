/**
 * Cross-Filter Bar Component
 * Story 2.3: Advanced Filtering & Cross-Filtering
 * 
 * Bar showing all active cross-filters with ability to clear individual or all filters.
 */

import React from 'react';
import { Box, Chip, Button, Typography, Paper, Stack } from '@mui/material';
import { Close as CloseIcon, ClearAll as ClearAllIcon } from '@mui/icons-material';
import { useCrossFilter } from '../../contexts/CrossFilterContext';

/**
 * Cross-Filter Bar Component
 */
export const CrossFilterBar: React.FC = () => {
  const { crossFilters, removeCrossFilterByChart, clearAllCrossFilters } = useCrossFilter();

  // Don't render if no cross-filters are active
  if (crossFilters.length === 0) {
    return null;
  }

  /**
   * Get display text for a cross-filter
   */
  const getCrossFilterText = (field: string, values: any[]): string => {
    const valueCount = values.length;
    if (valueCount === 0) return field;
    if (valueCount === 1) return `${field} = ${values[0]}`;
    if (valueCount <= 3) return `${field} in [${values.join(', ')}]`;
    return `${field} in [${values.slice(0, 2).join(', ')}, +${valueCount - 2} more]`;
  };

  return (
    <Paper
      elevation={2}
      sx={{
        p: 1.5,
        mb: 2,
        bgcolor: 'primary.light',
        borderLeft: 4,
        borderColor: 'primary.main',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
          <Typography variant="subtitle2" color="primary.dark" sx={{ fontWeight: 600 }}>
            Cross-Filters Active:
          </Typography>

          <Stack direction="row" spacing={1} sx={{ flex: 1, overflow: 'auto' }}>
            {crossFilters.map((cf) => (
              <Chip
                key={cf.sourceChartId}
                label={getCrossFilterText(cf.field, cf.values)}
                size="small"
                onDelete={() => removeCrossFilterByChart(cf.sourceChartId)}
                deleteIcon={<CloseIcon />}
                sx={{
                  bgcolor: 'background.paper',
                  '& .MuiChip-deleteIcon': {
                    color: 'error.main',
                  },
                }}
              />
            ))}
          </Stack>
        </Box>

        <Button
          size="small"
          variant="outlined"
          startIcon={<ClearAllIcon />}
          onClick={clearAllCrossFilters}
          sx={{
            ml: 2,
            borderColor: 'primary.dark',
            color: 'primary.dark',
            '&:hover': {
              borderColor: 'primary.dark',
              bgcolor: 'primary.dark',
              color: 'primary.contrastText',
            },
          }}
        >
          Clear All
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        Click on chart elements to add cross-filters. Click the × to remove individual filters.
      </Typography>
    </Paper>
  );
};

