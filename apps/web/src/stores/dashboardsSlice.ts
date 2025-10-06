import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice, createSelector } from '@reduxjs/toolkit';
import type { ListParams } from '../services/dashboardService';
import dashboardService from '../services/dashboardService';
import type { DashboardDefinition, DashboardListResponse, DashboardMeta } from '../types/dashboard';

export interface DashboardsState {
  items: DashboardMeta[];
  total: number;
  page: number;
  pageSize: number;
  q: string;
  loading: boolean;
  error: string | null;
  byId: Record<string, DashboardDefinition | undefined>;
}

const initialState: DashboardsState = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 12,
  q: '',
  loading: false,
  error: null,
  byId: {},
};

export const fetchDashboards = createAsyncThunk(
  'dashboards/list',
  async (params: ListParams | undefined, { rejectWithValue }) => {
    try {
      const res = await dashboardService.list(params);
      return res;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.error || 'Failed to load dashboards');
    }
  },
);

export const fetchDashboardById = createAsyncThunk(
  'dashboards/getById',
  async (id: string, { rejectWithValue }) => {
    try {
      const res = await dashboardService.getById(id);
      return res;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.error || 'Failed to load dashboard');
    }
  },
);

export const createDashboard = createAsyncThunk(
  'dashboards/create',
  async (meta: Partial<DashboardMeta>, { rejectWithValue }) => {
    try {
      return await dashboardService.create(meta);
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.error || 'Failed to create dashboard');
    }
  },
);

export const deleteDashboard = createAsyncThunk(
  'dashboards/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await dashboardService.remove(id);
      return id;
    } catch (e: any) {
      return rejectWithValue(e?.response?.data?.error || 'Failed to delete dashboard');
    }
  },
);

const dashboardsSlice = createSlice({
  name: 'dashboards',
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) {
      state.q = action.payload;
    },
    setPage(state, action: PayloadAction<number>) {
      state.page = action.payload;
    },
    setPageSize(state, action: PayloadAction<number>) {
      state.pageSize = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboards.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboards.fulfilled, (state, action: PayloadAction<DashboardListResponse>) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.pageSize = action.payload.pageSize;
      })
      .addCase(fetchDashboards.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || null;
      })
      .addCase(
        fetchDashboardById.fulfilled,
        (state, action: PayloadAction<DashboardDefinition>) => {
          state.byId[action.payload.id] = action.payload;
        },
      )
      .addCase(createDashboard.fulfilled, (state, action: PayloadAction<DashboardMeta>) => {
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(deleteDashboard.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((d) => d.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      });
  },
});

export const { setQuery, setPage, setPageSize } = dashboardsSlice.actions;
export default dashboardsSlice.reducer;

// Selectors
export const selectDashboardsState = (s: any) => s.dashboards as DashboardsState;
export const selectDashboards = createSelector(selectDashboardsState, (s) => s.items);
export const selectDashboardsLoading = createSelector(selectDashboardsState, (s) => s.loading);
export const selectDashboardById = (id: string) => (s: any) => selectDashboardsState(s).byId[id];
