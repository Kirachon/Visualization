export type DashboardComponentType = 'bar' | 'line' | 'pie' | 'table';

export interface DashboardMeta {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  tags: string[];
  ownerId: string;
  isShared?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LayoutItem {
  i: string; // component id
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean;
}

export interface DataBinding {
  dataSourceId: string;
  query: string;
}

export interface ComponentConfigBase {
  id: string;
  type: DashboardComponentType;
  title?: string;
  description?: string;
  bindings?: DataBinding;
  options?: Record<string, unknown>; // formatting, colors, legend, etc.
}

export interface DashboardDefinition {
  id: string;
  meta: DashboardMeta;
  layout: LayoutItem[];
  components: ComponentConfigBase[];
  version?: number; // optimistic concurrency control (if provided by backend)
}

export interface DashboardListResponse {
  items: DashboardMeta[];
  total: number;
  page: number;
  pageSize: number;
}
