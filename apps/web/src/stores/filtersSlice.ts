/**
 * Filters Redux Slice
 * Story 2.3: Advanced Filtering & Cross-Filtering
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/**
 * Filter operators (matching backend)
 */
export enum FilterOperator {
  EQ = 'eq',
  NEQ = 'neq',
  GT = 'gt',
  GTE = 'gte',
  LT = 'lt',
  LTE = 'lte',
  BETWEEN = 'between',
  IN = 'in',
  NOT_IN = 'not_in',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  REGEX = 'regex',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
  IS_TRUE = 'is_true',
  IS_FALSE = 'is_false',
}

/**
 * Logical operators
 */
export enum LogicalOperator {
  AND = 'and',
  OR = 'or',
}

/**
 * Filter predicate
 */
export interface FilterPredicate {
  field: string;
  operator: FilterOperator;
  value?: any;
  values?: any[];
  range?: { min: any; max: any };
  caseSensitive?: boolean;
}

/**
 * Filter group
 */
export interface FilterGroup {
  operator: LogicalOperator;
  predicates: (FilterPredicate | FilterGroup)[];
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  operator?: LogicalOperator;
  predicates: (FilterPredicate | FilterGroup)[];
}

/**
 * Cross-filter event
 */
export interface CrossFilterEvent {
  sourceChartId: string;
  field: string;
  values: any[];
  operator: FilterOperator;
  timestamp: number;
}

/**
 * Saved filter set
 */
export interface FilterSet {
  id: string;
  name: string;
  description?: string;
  predicates: FilterConfig;
  isGlobal: boolean;
}

/**
 * Filters state
 */
interface FiltersState {
  // Global filters applied to all charts
  globalFilters: FilterConfig;

  // Cross-filters from chart interactions
  crossFilters: CrossFilterEvent[];

  // Saved filter sets
  filterSets: FilterSet[];

  // Active filter set ID
  activeFilterSetId?: string;

  // Loading states
  loading: boolean;
  error?: string;
}

const initialState: FiltersState = {
  globalFilters: {
    operator: LogicalOperator.AND,
    predicates: [],
  },
  crossFilters: [],
  filterSets: [],
  loading: false,
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    // Global filters
    setGlobalFilters(state, action: PayloadAction<FilterConfig>) {
      state.globalFilters = action.payload;
    },
    addGlobalFilter(state, action: PayloadAction<FilterPredicate>) {
      state.globalFilters.predicates.push(action.payload);
    },
    removeGlobalFilter(state, action: PayloadAction<number>) {
      state.globalFilters.predicates.splice(action.payload, 1);
    },
    clearGlobalFilters(state) {
      state.globalFilters.predicates = [];
    },

    // Cross-filters
    addCrossFilter(state, action: PayloadAction<CrossFilterEvent>) {
      // Remove existing cross-filter from the same chart
      state.crossFilters = state.crossFilters.filter(
        cf => cf.sourceChartId !== action.payload.sourceChartId
      );
      state.crossFilters.push(action.payload);
    },
    removeCrossFilter(state, action: PayloadAction<string>) {
      state.crossFilters = state.crossFilters.filter(
        cf => cf.sourceChartId !== action.payload
      );
    },
    clearCrossFilters(state) {
      state.crossFilters = [];
    },

    // Filter sets
    setFilterSets(state, action: PayloadAction<FilterSet[]>) {
      state.filterSets = action.payload;
    },
    addFilterSet(state, action: PayloadAction<FilterSet>) {
      state.filterSets.push(action.payload);
    },
    updateFilterSet(state, action: PayloadAction<FilterSet>) {
      const index = state.filterSets.findIndex(fs => fs.id === action.payload.id);
      if (index !== -1) {
        state.filterSets[index] = action.payload;
      }
    },
    removeFilterSet(state, action: PayloadAction<string>) {
      state.filterSets = state.filterSets.filter(fs => fs.id !== action.payload);
    },
    setActiveFilterSet(state, action: PayloadAction<string | undefined>) {
      state.activeFilterSetId = action.payload;
      if (action.payload) {
        const filterSet = state.filterSets.find(fs => fs.id === action.payload);
        if (filterSet) {
          state.globalFilters = filterSet.predicates;
        }
      }
    },

    // Loading states
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | undefined>) {
      state.error = action.payload;
    },
  },
});

export const {
  setGlobalFilters,
  addGlobalFilter,
  removeGlobalFilter,
  clearGlobalFilters,
  addCrossFilter,
  removeCrossFilter,
  clearCrossFilters,
  setFilterSets,
  addFilterSet,
  updateFilterSet,
  removeFilterSet,
  setActiveFilterSet,
  setLoading,
  setError,
} = filtersSlice.actions;

export default filtersSlice.reducer;
