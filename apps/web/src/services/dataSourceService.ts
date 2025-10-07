import apiClient from './api';

export interface DataSourceConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string | { iv: string; authTag: string; ct: string };
  ssl?: boolean;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'postgresql';
  connectionConfig: DataSourceConnectionConfig;
  status: 'active' | 'inactive' | 'error';
  tenantId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDataSourceRequest {
  name: string;
  type: 'postgresql';
  connectionConfig: Omit<DataSourceConnectionConfig, 'password'> & { password: string };
}

export interface UpdateDataSourceRequest {
  name?: string;
  connectionConfig?: Partial<DataSourceConnectionConfig>;
  status?: 'active' | 'inactive' | 'error';
}

export interface TestConnectionRequest {
  connectionConfig: DataSourceConnectionConfig;
}

export interface SchemaTable {
  schemaName: string;
  tableName: string;
  columns: SchemaColumn[];
}

export interface SchemaColumn {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  columnDefault?: string;
}

export interface QueryRequest {
  sql: string;
  limit?: number;
}

export interface QueryResult {
  rows: any[];
  rowCount: number;
  executionTime: number;
  metadata?: { engine?: 'oltp' | 'olap'; cacheHit?: boolean };
}

class DataSourceService {
  async create(data: CreateDataSourceRequest): Promise<DataSource> {
    const response = await apiClient.post<DataSource>('/data-sources', data);
    return response.data;
  }

  async list(): Promise<DataSource[]> {
    const response = await apiClient.get<DataSource[]>('/data-sources');
    return response.data;
  }

  async getById(id: string): Promise<DataSource> {
    const response = await apiClient.get<DataSource>(`/data-sources/${id}`);
    return response.data;
  }

  async update(id: string, data: UpdateDataSourceRequest): Promise<DataSource> {
    const response = await apiClient.put<DataSource>(`/data-sources/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/data-sources/${id}`);
  }

  async testConnection(
    type: string,
    config: DataSourceConnectionConfig,
  ): Promise<{ ok: boolean; message?: string }> {
    const response = await apiClient.post<{ ok: boolean; message?: string }>('/data-sources/test', {
      type,
      connectionConfig: config,
    });
    return response.data;
  }

  async discoverSchema(id: string): Promise<SchemaTable[]> {
    const response = await apiClient.get<SchemaTable[]>(`/data-sources/${id}/schema`);
    return response.data;
  }

  async executeQuery(id: string, queryReq: QueryRequest, opts?: { signal?: AbortSignal }): Promise<QueryResult> {
    const response = await apiClient.post<QueryResult>(`/data-sources/${id}/query`, queryReq, { signal: opts?.signal });
    return response.data;
  }
}

export const dataSourceService = new DataSourceService();
export default dataSourceService;
