/**
 * Connector Service
 * 
 * Service for interacting with database connector APIs.
 */

import apiClient from './apiClient';

export interface TestConnectionRequest {
  type: string;
  config: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
  };
}

export interface TestConnectionResponse {
  success: boolean;
  message?: string;
  latencyMs?: number;
  error?: string;
}

export interface IntrospectSchemaRequest {
  type: string;
  config: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
  };
}

export interface SchemaInfo {
  schemas: SchemaDefinition[];
}

export interface SchemaDefinition {
  schemaName: string;
  tables: TableDefinition[];
}

export interface TableDefinition {
  tableName: string;
  columns: ColumnDefinition[];
  primaryKeys?: string[];
}

export interface ColumnDefinition {
  columnName: string;
  dataType: string;
  isNullable: boolean;
  defaultValue?: string | null;
  maxLength?: number;
  precision?: number;
  scale?: number;
}

export interface StartImportRequest {
  dataSourceId: string;
  fileName: string;
  fileType: 'csv' | 'json';
  tableName: string;
  options?: {
    batchSize?: number;
    mode?: 'insert' | 'upsert' | 'replace';
    delimiter?: string;
    hasHeader?: boolean;
    columnMapping?: Record<string, string>;
  };
}

export interface ImportJob {
  id: string;
  tenantId: string;
  dataSourceId?: string;
  fileName: string;
  fileSize?: number;
  fileType: string;
  tableName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: {
    totalRows: number;
    processedRows: number;
    successfulRows: number;
    failedRows: number;
    percentage: number;
  };
  errorCount: number;
  errors: any[];
  options: any;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface DataSourceHealth {
  dataSourceId: string;
  status: 'healthy' | 'degraded' | 'down';
  latencyMs?: number;
  message?: string;
  lastCheckedAt: string;
}

class ConnectorService {
  /**
   * Test database connection
   */
  async testConnection(request: TestConnectionRequest): Promise<TestConnectionResponse> {
    const response = await apiClient.post<TestConnectionResponse>('/connectors/test', request);
    return response.data;
  }

  /**
   * Introspect database schema
   */
  async introspectSchema(request: IntrospectSchemaRequest): Promise<SchemaInfo> {
    const response = await apiClient.post<{ success: boolean; data: SchemaInfo }>('/connectors/introspect', request);
    return response.data.data;
  }

  /**
   * Start file import job
   */
  async startImport(request: StartImportRequest): Promise<{ jobId: string; status: string }> {
    const response = await apiClient.post<{ success: boolean; data: { jobId: string; status: string } }>('/connectors/import', request);
    return response.data.data;
  }

  /**
   * Get import job status and progress
   */
  async getImportJob(jobId: string): Promise<ImportJob> {
    const response = await apiClient.get<{ success: boolean; data: ImportJob }>(`/connectors/jobs/${jobId}`);
    return response.data.data;
  }

  /**
   * List import jobs
   */
  async listImportJobs(limit: number = 50, offset: number = 0): Promise<ImportJob[]> {
    const response = await apiClient.get<{ success: boolean; data: ImportJob[] }>('/connectors/jobs', {
      params: { limit, offset },
    });
    return response.data.data;
  }

  /**
   * Get data source health status
   */
  async getDataSourceHealth(dataSourceId: string): Promise<DataSourceHealth> {
    const response = await apiClient.get<{ success: boolean; data: DataSourceHealth }>(`/connectors/health/${dataSourceId}`);
    return response.data.data;
  }
}

export default new ConnectorService();

