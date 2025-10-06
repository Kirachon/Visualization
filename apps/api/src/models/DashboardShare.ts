export interface DashboardShare {
  id: string;
  dashboardId: string;
  userId: string;
  permission: 'view' | 'edit';
  createdAt: Date;
  createdBy: string;
}

export interface PublicDashboardLink {
  id: string;
  dashboardId: string;
  token: string;
  expiresAt?: Date;
  createdAt: Date;
  createdBy: string;
}

export interface CreateShareRequest {
  dashboardId: string;
  userId: string;
  permission: 'view' | 'edit';
}

export interface CreatePublicLinkRequest {
  dashboardId: string;
  expiresAt?: Date;
}

