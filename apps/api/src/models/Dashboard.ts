export interface DashboardComponent {
  id: string;
  type: 'bar' | 'line' | 'pie' | 'table';
  x: number;
  y: number;
  w: number;
  h: number;
  dataBinding?: {
    dataSourceId: string;
    query: string;
    fieldMapping: Record<string, string>;
  };
  config?: Record<string, unknown>;
}

export interface DashboardLayout {
  cols: number;
  rowHeight: number;
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  layout: DashboardLayout;
  components: DashboardComponent[];
  filters?: Record<string, unknown>;
  tags?: string[];
  tenantId: string;
  ownerId: string;
  isPublic: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface CreateDashboardInput {
  name: string;
  description?: string;
  layout?: DashboardLayout;
  components?: DashboardComponent[];
}

export interface UpdateDashboardInput {
  name?: string;
  description?: string;
  layout?: DashboardLayout;
  components?: DashboardComponent[];
  isPublic?: boolean;
}

