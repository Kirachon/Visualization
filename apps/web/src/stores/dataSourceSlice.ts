import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type {
  DataSource,
  CreateDataSourceRequest,
  UpdateDataSourceRequest,
} from '../services/dataSourceService';
import dataSourceService from '../services/dataSourceService';

interface DataSourceState {
  dataSources: DataSource[];
  currentDataSource: DataSource | null;
  loading: boolean;
  error: string | null;
}

const initialState: DataSourceState = {
  dataSources: [],
  currentDataSource: null,
  loading: false,
  error: null,
};

export const fetchDataSources = createAsyncThunk('dataSource/fetchAll', async () => {
  return await dataSourceService.list();
});

export const fetchDataSourceById = createAsyncThunk('dataSource/fetchById', async (id: string) => {
  return await dataSourceService.getById(id);
});

export const createDataSource = createAsyncThunk(
  'dataSource/create',
  async (data: CreateDataSourceRequest) => {
    return await dataSourceService.create(data);
  },
);

export const updateDataSource = createAsyncThunk(
  'dataSource/update',
  async ({ id, data }: { id: string; data: UpdateDataSourceRequest }) => {
    return await dataSourceService.update(id, data);
  },
);

export const deleteDataSource = createAsyncThunk('dataSource/delete', async (id: string) => {
  await dataSourceService.delete(id);
  return id;
});

const dataSourceSlice = createSlice({
  name: 'dataSource',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentDataSource: (state, action: PayloadAction<DataSource | null>) => {
      state.currentDataSource = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all
      .addCase(fetchDataSources.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDataSources.fulfilled, (state, action) => {
        state.loading = false;
        state.dataSources = action.payload;
      })
      .addCase(fetchDataSources.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch data sources';
      })
      // Fetch by ID
      .addCase(fetchDataSourceById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDataSourceById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDataSource = action.payload;
      })
      .addCase(fetchDataSourceById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch data source';
      })
      // Create
      .addCase(createDataSource.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDataSource.fulfilled, (state, action) => {
        state.loading = false;
        state.dataSources.push(action.payload);
      })
      .addCase(createDataSource.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create data source';
      })
      // Update
      .addCase(updateDataSource.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDataSource.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.dataSources.findIndex((ds) => ds.id === action.payload.id);
        if (index !== -1) {
          state.dataSources[index] = action.payload;
        }
        if (state.currentDataSource?.id === action.payload.id) {
          state.currentDataSource = action.payload;
        }
      })
      .addCase(updateDataSource.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update data source';
      })
      // Delete
      .addCase(deleteDataSource.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDataSource.fulfilled, (state, action) => {
        state.loading = false;
        state.dataSources = state.dataSources.filter((ds) => ds.id !== action.payload);
        if (state.currentDataSource?.id === action.payload) {
          state.currentDataSource = null;
        }
      })
      .addCase(deleteDataSource.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete data source';
      });
  },
});

export const { clearError, setCurrentDataSource } = dataSourceSlice.actions;
export default dataSourceSlice.reducer;
