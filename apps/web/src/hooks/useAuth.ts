import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../stores/store';
import {
  loginStart,
  loginSuccess,
  loginFailure,
  logout as logoutAction,
} from '../stores/authSlice';
import { authApi } from '../services/authService';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, error } = useSelector((state: RootState) => state.auth);

  const login = async (username: string, password: string) => {
    try {
      dispatch(loginStart());
      const result = await authApi.login({ username, password });
      dispatch(loginSuccess(result.user));
      navigate('/dashboard');
    } catch (err: any) {
      dispatch(loginFailure(err.response?.data?.error?.message || 'Login failed'));
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
      dispatch(logoutAction());
      navigate('/login');
    } catch (err) {
      // Even if logout fails on server, clear local state
      dispatch(logoutAction());
      navigate('/login');
    }
  };

  const refreshToken = async () => {
    try {
      // Refresh token is sent automatically via httpOnly cookie
      await authApi.refresh();
    } catch (err) {
      dispatch(logoutAction());
      navigate('/login');
    }
  };

  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    refreshToken,
  };
};
