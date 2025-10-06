import { apiClient } from './api';
import type { User, LoginRequest, AuthResult } from '../types';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResult> => {
    const response = await apiClient.post<AuthResult>('/auth/login', credentials);
    // Tokens are stored in httpOnly cookies by backend - no localStorage needed
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
    // Backend clears httpOnly cookies
  },

  refresh: async (): Promise<{ token: string }> => {
    // Refresh token is sent automatically via httpOnly cookie
    const response = await apiClient.post<{ token: string }>('/auth/refresh', {});
    // New token is set in httpOnly cookie by backend
    return response.data;
  },

  me: async (): Promise<{ user: User }> => {
    const response = await apiClient.get<{ user: User }>('/auth/me');
    return response.data;
  },
};
