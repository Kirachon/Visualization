/**
 * Cross-Filter Indicator Component
 * Story 2.3: Advanced Filtering & Cross-Filtering
 * 
 * Visual indicator for active cross-filters on charts.
 */

import React from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import { FilterList as FilterIcon, Close as CloseIcon } from '@mui/icons-material';
import { useCrossFilter } from '../../contexts/CrossFilterContext';

interface CrossFilterIndicatorProps {
  chartId: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Cross-Filter Indicator Component
 */
export const CrossFilterIndicator: React.FC<CrossFilterIndicatorProps> = ({
  chartId,
  position = 'top-right',
}) => {
  const { isChartFiltering, getCrossFilterForChart, removeCrossFilterByChart } = useCrossFilter();

  const isFiltering = isChartFiltering(chartId);
  const crossFilter = getCrossFilterForChart(chartId);

  if (!isFiltering || !crossFilter) {
    return null;
  }

  /**
   * Get position styles
   */
  const getPositionStyles = () => {
    const baseStyles = {
      position: 'absolute' as const,
      zIndex: 10,
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyles, top: 8, left: 8 };
      case 'top-right':
        return { ...baseStyles, top: 8, right: 8 };
      case 'bottom-left':
        return { ...baseStyles, bottom: 8, left: 8 };
      case 'bottom-right':
        return { ...baseStyles, bottom: 8, right: 8 };
      default:
        return { ...baseStyles, top: 8, right: 8 };
    }
  };

  /**
   * Get filter summary text
   */
  const getFilterSummary = () => {
    const valueCount = crossFilter.values.length;
    return `${crossFilter.field}: ${valueCount} value${valueCount !== 1 ? 's' : ''}`;
  };

  return (
    <Box sx={getPositionStyles()}>
      <Tooltip
        title={
          <Box>
            <div>
              <strong>Cross-Filter Active</strong>
            </div>
            <div>Field: {crossFilter.field}</div>
            <div>Values: {crossFilter.values.slice(0, 5).join(', ')}</div>
            {crossFilter.values.length > 5 && <div>...and {crossFilter.values.length - 5} more</div>}
          </Box>
        }
      >
        <Chip
          icon={<FilterIcon />}
          label={getFilterSummary()}
          size="small"
          color="primary"
          onDelete={() => removeCrossFilterByChart(chartId)}
          deleteIcon={<CloseIcon />}
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            '& .MuiChip-deleteIcon': {
              color: 'primary.contrastText',
            },
          }}
        />
      </Tooltip>
    </Box>
  );
};

