import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type FilterOp = 'eq' | 'neq';
export interface GlobalFilter { key: string; op: FilterOp; value: string | number }

interface FiltersState { globals: GlobalFilter[] }
const initialState: FiltersState = { globals: [] };

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setGlobalFilters(state, action: PayloadAction<GlobalFilter[]>) {
      state.globals = action.payload;
    },
    addGlobalFilter(state, action: PayloadAction<GlobalFilter>) {
      state.globals.push(action.payload);
    },
    clearGlobalFilters(state) {
      state.globals = [];
    },
  },
});

export const { setGlobalFilters, addGlobalFilter, clearGlobalFilters } = filtersSlice.actions;
export default filtersSlice.reducer;

