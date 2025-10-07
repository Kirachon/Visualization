/**
 * Cross-Filter Context
 * Story 2.3: Advanced Filtering & Cross-Filtering
 * 
 * Context for managing cross-filter events and communication between charts.
 */

import React, { createContext, useContext, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../stores/store';
import {
  addCrossFilter,
  removeCrossFilter,
  clearCrossFilters,
  CrossFilterEvent,
  FilterOperator,
} from '../stores/filtersSlice';

/**
 * Cross-filter context type
 */
interface CrossFilterContextType {
  /**
   * Active cross-filters
   */
  crossFilters: CrossFilterEvent[];

  /**
   * Apply a cross-filter from a chart
   */
  applyCrossFilter: (sourceChartId: string, field: string, values: any[]) => void;

  /**
   * Remove a cross-filter from a specific chart
   */
  removeCrossFilterByChart: (sourceChartId: string) => void;

  /**
   * Clear all cross-filters
   */
  clearAllCrossFilters: () => void;

  /**
   * Check if a chart is the source of an active cross-filter
   */
  isChartFiltering: (chartId: string) => boolean;

  /**
   * Get cross-filter for a specific chart
   */
  getCrossFilterForChart: (chartId: string) => CrossFilterEvent | undefined;
}

const CrossFilterContext = createContext<CrossFilterContextType | undefined>(undefined);

/**
 * Cross-Filter Provider Component
 */
export const CrossFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const crossFilters = useSelector((state: RootState) => state.filters?.crossFilters || []);

  /**
   * Apply a cross-filter
   */
  const applyCrossFilter = useCallback(
    (sourceChartId: string, field: string, values: any[]) => {
      const event: CrossFilterEvent = {
        sourceChartId,
        field,
        values,
        operator: FilterOperator.IN,
        timestamp: Date.now(),
      };

      dispatch(addCrossFilter(event));
    },
    [dispatch]
  );

  /**
   * Remove cross-filter by chart ID
   */
  const removeCrossFilterByChart = useCallback(
    (sourceChartId: string) => {
      dispatch(removeCrossFilter(sourceChartId));
    },
    [dispatch]
  );

  /**
   * Clear all cross-filters
   */
  const clearAllCrossFilters = useCallback(() => {
    dispatch(clearCrossFilters());
  }, [dispatch]);

  /**
   * Check if a chart is filtering
   */
  const isChartFiltering = useCallback(
    (chartId: string) => {
      return crossFilters.some((cf) => cf.sourceChartId === chartId);
    },
    [crossFilters]
  );

  /**
   * Get cross-filter for a specific chart
   */
  const getCrossFilterForChart = useCallback(
    (chartId: string) => {
      return crossFilters.find((cf) => cf.sourceChartId === chartId);
    },
    [crossFilters]
  );

  const value: CrossFilterContextType = {
    crossFilters,
    applyCrossFilter,
    removeCrossFilterByChart,
    clearAllCrossFilters,
    isChartFiltering,
    getCrossFilterForChart,
  };

  return <CrossFilterContext.Provider value={value}>{children}</CrossFilterContext.Provider>;
};

/**
 * Hook to use cross-filter context
 */
export const useCrossFilter = (): CrossFilterContextType => {
  const context = useContext(CrossFilterContext);
  if (!context) {
    throw new Error('useCrossFilter must be used within a CrossFilterProvider');
  }
  return context;
};

