/**
 * Filters Redux Slice Tests
 * Story 2.3: Advanced Filtering & Cross-Filtering
 */

import filtersReducer, {
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
  FilterOperator,
  LogicalOperator,
  FilterConfig,
  FilterPredicate,
  CrossFilterEvent,
  FilterSet,
} from '../filtersSlice';

describe('filtersSlice', () => {
  const initialState = {
    globalFilters: {
      operator: LogicalOperator.AND,
      predicates: [],
    },
    crossFilters: [],
    filterSets: [],
    loading: false,
  };

  describe('Global Filters', () => {
    it('should handle setGlobalFilters', () => {
      const newFilters: FilterConfig = {
        operator: LogicalOperator.OR,
        predicates: [
          {
            field: 'name',
            operator: FilterOperator.EQ,
            value: 'John',
          },
        ],
      };

      const state = filtersReducer(initialState, setGlobalFilters(newFilters));

      expect(state.globalFilters).toEqual(newFilters);
    });

    it('should handle addGlobalFilter', () => {
      const predicate: FilterPredicate = {
        field: 'age',
        operator: FilterOperator.GT,
        value: 18,
      };

      const state = filtersReducer(initialState, addGlobalFilter(predicate));

      expect(state.globalFilters.predicates).toHaveLength(1);
      expect(state.globalFilters.predicates[0]).toEqual(predicate);
    });

    it('should handle removeGlobalFilter', () => {
      const stateWithFilters = {
        ...initialState,
        globalFilters: {
          operator: LogicalOperator.AND,
          predicates: [
            {
              field: 'name',
              operator: FilterOperator.EQ,
              value: 'John',
            },
            {
              field: 'age',
              operator: FilterOperator.GT,
              value: 18,
            },
          ],
        },
      };

      const state = filtersReducer(stateWithFilters, removeGlobalFilter(0));

      expect(state.globalFilters.predicates).toHaveLength(1);
      expect(state.globalFilters.predicates[0].field).toBe('age');
    });

    it('should handle clearGlobalFilters', () => {
      const stateWithFilters = {
        ...initialState,
        globalFilters: {
          operator: LogicalOperator.AND,
          predicates: [
            {
              field: 'name',
              operator: FilterOperator.EQ,
              value: 'John',
            },
          ],
        },
      };

      const state = filtersReducer(stateWithFilters, clearGlobalFilters());

      expect(state.globalFilters.predicates).toHaveLength(0);
    });
  });

  describe('Cross-Filters', () => {
    it('should handle addCrossFilter', () => {
      const crossFilter: CrossFilterEvent = {
        sourceChartId: 'chart-1',
        field: 'category',
        values: ['A', 'B', 'C'],
        operator: FilterOperator.IN,
        timestamp: Date.now(),
      };

      const state = filtersReducer(initialState, addCrossFilter(crossFilter));

      expect(state.crossFilters).toHaveLength(1);
      expect(state.crossFilters[0]).toEqual(crossFilter);
    });

    it('should replace existing cross-filter from same chart', () => {
      const crossFilter1: CrossFilterEvent = {
        sourceChartId: 'chart-1',
        field: 'category',
        values: ['A'],
        operator: FilterOperator.IN,
        timestamp: Date.now(),
      };

      const crossFilter2: CrossFilterEvent = {
        sourceChartId: 'chart-1',
        field: 'category',
        values: ['B'],
        operator: FilterOperator.IN,
        timestamp: Date.now(),
      };

      let state = filtersReducer(initialState, addCrossFilter(crossFilter1));
      state = filtersReducer(state, addCrossFilter(crossFilter2));

      expect(state.crossFilters).toHaveLength(1);
      expect(state.crossFilters[0].values).toEqual(['B']);
    });

    it('should handle removeCrossFilter', () => {
      const stateWithCrossFilters = {
        ...initialState,
        crossFilters: [
          {
            sourceChartId: 'chart-1',
            field: 'category',
            values: ['A'],
            operator: FilterOperator.IN,
            timestamp: Date.now(),
          },
          {
            sourceChartId: 'chart-2',
            field: 'status',
            values: ['active'],
            operator: FilterOperator.IN,
            timestamp: Date.now(),
          },
        ],
      };

      const state = filtersReducer(stateWithCrossFilters, removeCrossFilter('chart-1'));

      expect(state.crossFilters).toHaveLength(1);
      expect(state.crossFilters[0].sourceChartId).toBe('chart-2');
    });

    it('should handle clearCrossFilters', () => {
      const stateWithCrossFilters = {
        ...initialState,
        crossFilters: [
          {
            sourceChartId: 'chart-1',
            field: 'category',
            values: ['A'],
            operator: FilterOperator.IN,
            timestamp: Date.now(),
          },
        ],
      };

      const state = filtersReducer(stateWithCrossFilters, clearCrossFilters());

      expect(state.crossFilters).toHaveLength(0);
    });
  });

  describe('Filter Sets', () => {
    const mockFilterSet: FilterSet = {
      id: 'set-1',
      name: 'My Filter Set',
      description: 'Test filter set',
      predicates: {
        operator: LogicalOperator.AND,
        predicates: [
          {
            field: 'name',
            operator: FilterOperator.EQ,
            value: 'John',
          },
        ],
      },
      isGlobal: false,
    };

    it('should handle setFilterSets', () => {
      const filterSets = [mockFilterSet];

      const state = filtersReducer(initialState, setFilterSets(filterSets));

      expect(state.filterSets).toEqual(filterSets);
    });

    it('should handle addFilterSet', () => {
      const state = filtersReducer(initialState, addFilterSet(mockFilterSet));

      expect(state.filterSets).toHaveLength(1);
      expect(state.filterSets[0]).toEqual(mockFilterSet);
    });

    it('should handle updateFilterSet', () => {
      const stateWithFilterSets = {
        ...initialState,
        filterSets: [mockFilterSet],
      };

      const updatedFilterSet = {
        ...mockFilterSet,
        name: 'Updated Name',
      };

      const state = filtersReducer(stateWithFilterSets, updateFilterSet(updatedFilterSet));

      expect(state.filterSets[0].name).toBe('Updated Name');
    });

    it('should handle removeFilterSet', () => {
      const stateWithFilterSets = {
        ...initialState,
        filterSets: [mockFilterSet],
      };

      const state = filtersReducer(stateWithFilterSets, removeFilterSet('set-1'));

      expect(state.filterSets).toHaveLength(0);
    });

    it('should handle setActiveFilterSet and apply its predicates', () => {
      const stateWithFilterSets = {
        ...initialState,
        filterSets: [mockFilterSet],
      };

      const state = filtersReducer(stateWithFilterSets, setActiveFilterSet('set-1'));

      expect(state.activeFilterSetId).toBe('set-1');
      expect(state.globalFilters).toEqual(mockFilterSet.predicates);
    });

    it('should handle clearing active filter set', () => {
      const stateWithActiveSet = {
        ...initialState,
        filterSets: [mockFilterSet],
        activeFilterSetId: 'set-1',
      };

      const state = filtersReducer(stateWithActiveSet, setActiveFilterSet(undefined));

      expect(state.activeFilterSetId).toBeUndefined();
    });
  });
});
