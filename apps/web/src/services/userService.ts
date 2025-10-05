import { apiClient } from './api';
import type { User } from '@/types';

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleId: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  isActive?: boolean;
}

export interface ListUsersParams {
  q?: string;
  page?: number;
  pageSize?: number;
}

class UserService {
  async list(params: ListUsersParams = {}): Promise<{ items: User[]; total: number }> {
    const res = await apiClient.get('/users', { params });
    return res.data;
    
  }

  async getById(id: string): Promise<User> {
    const res = await apiClient.get(`/users/${id}`);
    return res.data;
  }

  async create(body: CreateUserRequest): Promise<User> {
    const res = await apiClient.post('/users', body);
    return res.data;
  }

  async update(id: string, body: UpdateUserRequest): Promise<User> {
    const res = await apiClient.put(`/users/${id}`, body);
    return res.data;
  }

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  }

  async initiatePasswordReset(email: string): Promise<void> {
    await apiClient.post('/users/password-reset/initiate', { email });
  }

  async completePasswordReset(token: string, password: string): Promise<void> {
    await apiClient.post('/users/password-reset/complete', { token, password });
  }
}

const userService = new UserService();
export default userService;

