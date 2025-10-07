/**
 * Cross-Filter HOC (Higher-Order Component)
 * Story 2.3: Advanced Filtering & Cross-Filtering
 * 
 * HOC that adds cross-filtering capability to any chart component.
 */

import React, { useCallback } from 'react';
import { Box } from '@mui/material';
import { useCrossFilter } from '../../contexts/CrossFilterContext';
import { CrossFilterIndicator } from './CrossFilterIndicator';

/**
 * Props injected by the HOC
 */
export interface WithCrossFilterProps {
  /**
   * Chart ID (required for cross-filtering)
   */
  chartId: string;

  /**
   * Field to use for cross-filtering
   */
  crossFilterField?: string;

  /**
   * Callback when a data point is clicked
   */
  onDataPointClick?: (field: string, values: any[]) => void;

  /**
   * Whether cross-filtering is enabled
   */
  crossFilterEnabled?: boolean;
}

/**
 * HOC that adds cross-filtering capability to a chart component
 */
export function withCrossFilter<P extends object>(
  WrappedComponent: React.ComponentType<P>
): React.FC<P & WithCrossFilterProps> {
  const WithCrossFilterComponent: React.FC<P & WithCrossFilterProps> = (props) => {
    const {
      chartId,
      crossFilterField,
      onDataPointClick,
      crossFilterEnabled = true,
      ...restProps
    } = props;

    const { applyCrossFilter, isChartFiltering, getCrossFilterForChart } = useCrossFilter();

    /**
     * Handle data point click
     */
    const handleDataPointClick = useCallback(
      (field: string, values: any[]) => {
        if (!crossFilterEnabled) {
          return;
        }

        // If already filtering on this chart, remove the filter
        if (isChartFiltering(chartId)) {
          // Toggle off - this will be handled by the CrossFilterIndicator
          return;
        }

        // Apply cross-filter
        applyCrossFilter(chartId, field, values);

        // Call custom callback if provided
        if (onDataPointClick) {
          onDataPointClick(field, values);
        }
      },
      [chartId, crossFilterEnabled, applyCrossFilter, isChartFiltering, onDataPointClick]
    );

    /**
     * Get active cross-filter for this chart
     */
    const activeCrossFilter = getCrossFilterForChart(chartId);

    /**
     * Enhanced props to pass to wrapped component
     */
    const enhancedProps = {
      ...restProps,
      onDataPointClick: handleDataPointClick,
      activeCrossFilter,
      isFiltering: isChartFiltering(chartId),
    } as P;

    return (
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* Cross-filter indicator */}
        {crossFilterEnabled && <CrossFilterIndicator chartId={chartId} />}

        {/* Wrapped chart component */}
        <WrappedComponent {...enhancedProps} />
      </Box>
    );
  };

  WithCrossFilterComponent.displayName = `withCrossFilter(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return WithCrossFilterComponent;
}

