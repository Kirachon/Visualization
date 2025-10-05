import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import userService, { CreateUserRequest, UpdateUserRequest, ListUsersParams } from '../services/userService';
import type { User } from '@/types';

export interface UsersState {
  items: User[];
  total: number;
  loading: boolean;
  error?: string | null;
}

const initialState: UsersState = {
  items: [],
  total: 0,
  loading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk('users/list', async (params: ListUsersParams | undefined) => {
  const res = await userService.list(params || {});
  return res;
});

export const createUser = createAsyncThunk('users/create', async (body: CreateUserRequest) => {
  const res = await userService.create(body);
  return res;
});

export const updateUser = createAsyncThunk('users/update', async (payload: { id: string; body: UpdateUserRequest }) => {
  const res = await userService.update(payload.id, payload.body);
  return res;
});

export const deleteUser = createAsyncThunk('users/delete', async (id: string) => {
  await userService.remove(id);
  return id;
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action: PayloadAction<{ items: User[]; total: number }>) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load users';
      })
      .addCase(createUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.items.unshift(action.payload);
        state.total += 1;
      })
      .addCase(updateUser.fulfilled, (state, action: PayloadAction<User>) => {
        const idx = state.items.findIndex((u) => u.id === action.payload.id);
        if (idx >= 0) state.items[idx] = action.payload;
      })
      .addCase(deleteUser.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter((u) => u.id !== action.payload);
        state.total = Math.max(0, state.total - 1);
      });
  },
});

export default usersSlice.reducer;

