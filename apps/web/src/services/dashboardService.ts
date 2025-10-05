import { apiClient } from './api';
import type { DashboardDefinition, DashboardListResponse, DashboardMeta } from '../types/dashboard';

export interface ListParams {
  q?: string;
  page?: number;
  pageSize?: number;
  tags?: string[];
}

export interface ShareRequest { userId?: string; roleId?: string; permissionType: 'view' | 'edit'; }
export interface PublicLinkResponse { token: string; url: string; }

class DashboardService {
  async list(params: ListParams = {}): Promise<DashboardListResponse> {
    const res = await apiClient.get<DashboardListResponse>('/dashboards', { params });
    return res.data;
  }

  async create(meta: Partial<DashboardMeta>): Promise<DashboardMeta> {
    const res = await apiClient.post<DashboardMeta>('/dashboards', meta);
    return res.data;
  }

  async getById(id: string): Promise<DashboardDefinition> {
    const res = await apiClient.get<DashboardDefinition>(`/dashboards/${id}`);
    return res.data;
  }

  async update(id: string, patch: Partial<DashboardDefinition>): Promise<DashboardDefinition> {
    const res = await apiClient.put<DashboardDefinition>(`/dashboards/${id}`, patch);
    return res.data;
  }

  async patch(id: string, patch: Partial<DashboardDefinition>): Promise<DashboardDefinition> {
    const res = await apiClient.patch<DashboardDefinition>(`/dashboards/${id}`, patch);
    return res.data;
  }

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/dashboards/${id}`);
  }

  // Optional: list shares for share indicator (no-op unless backend supports)
  listShares?: (id: string) => Promise<Array<{ id: string; userId?: string; createdAt: string }>>;

  // Sharing APIs
  async share(id: string, body: ShareRequest): Promise<void> {
    await apiClient.post(`/dashboards/${id}/share`, body);
  }

  async revokeShare(id: string, userId: string): Promise<void> {
    await apiClient.delete(`/dashboards/${id}/share/${userId}`);
  }

  async generatePublicLink(id: string): Promise<PublicLinkResponse> {
    const res = await apiClient.post(`/dashboards/${id}/public-link`);
    return res.data as PublicLinkResponse;
  }

  async getShared(): Promise<Array<{ id: string; name: string; permissionType: 'view' | 'edit' }>> {
    const res = await apiClient.get(`/dashboards/shared`);
    return res.data?.items || res.data;
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
