import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import dataSourceReducer from './dataSourceSlice';
import dashboardsReducer from './dashboardsSlice';
import builderReducer from './builderSlice';
import usersReducer from './userSlice';
import filtersReducer from './filtersSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dataSource: dataSourceReducer,
    dashboards: dashboardsReducer,
    builder: builderReducer,
    users: usersReducer,
    filters: filtersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['auth/login/fulfilled'],
        ignoredPaths: ['auth.user.createdAt', 'auth.user.updatedAt'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
