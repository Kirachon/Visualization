import type { AxiosInstance, AxiosError } from 'axios';
import axios from 'axios';

const API_URL: string = process.env.VITE_API_URL || '/api/v1';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Send cookies with requests
});

// Request interceptor - no need to add token manually, cookies are sent automatically
apiClient.interceptors.request.use(
  (config) => {
    // Cookies with JWT tokens are automatically sent with withCredentials: true
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call refresh endpoint - cookies are sent automatically
        await axios.post(`${API_URL}/auth/refresh`, {}, { withCredentials: true });

        // New token is set in httpOnly cookie by backend
        // Retry original request - cookie will be sent automatically
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
