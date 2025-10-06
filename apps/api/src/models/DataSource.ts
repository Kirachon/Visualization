export type DataSourceType = 'postgresql';

export interface DataSourceConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string; // encrypted at rest
  ssl?: boolean;
}

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  connectionConfig: DataSourceConnectionConfig;
  tenantId: string;
  ownerId: string;
  schemaInfo?: unknown;
  status: 'active' | 'inactive' | 'error';
  lastTestedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateDataSourceInput {
  name: string;
  type: DataSourceType;
  connectionConfig: Omit<DataSourceConnectionConfig, 'password'> & { password: string };
}

export interface UpdateDataSourceInput {
  name?: string;
  connectionConfig?: Partial<DataSourceConnectionConfig>;
  status?: 'active' | 'inactive' | 'error';
}

