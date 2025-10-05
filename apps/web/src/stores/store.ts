import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import dataSourceReducer from './dataSourceSlice';
import dashboardsReducer from './dashboardsSlice';
import builderReducer from './builderSlice';
import usersReducer from './userSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    dataSource: dataSourceReducer,
    dashboards: dashboardsReducer,
    builder: builderReducer,
    users: usersReducer,
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
