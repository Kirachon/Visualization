import React, { createContext, useContext, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { authApi } from '../services/authService';
import { loginSuccess, logout as logoutAction } from '../stores/authSlice';

interface AuthContextValue {}

const AuthContext = createContext<AuthContextValue>({});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { user } = await authApi.me();
        if (mounted && user) {
          dispatch(loginSuccess(user));
        }
      } catch {
        // Not authenticated; ensure clean state
        if (mounted) dispatch(logoutAction());
      }
    })();
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => useContext(AuthContext);
