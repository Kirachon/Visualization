/**
 * IConnector Interface
 * 
 * Defines the contract that all database connectors must implement.
 * This abstraction allows the platform to support multiple database types
 * with a unified interface.
 */

export interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  [key: string]: any; // Allow additional connector-specific options
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
  foreignKeys?: ForeignKeyDefinition[];
  indexes?: IndexDefinition[];
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

export interface ForeignKeyDefinition {
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface IndexDefinition {
  indexName: string;
  columns: string[];
  isUnique: boolean;
}

export interface QueryResult {
  rows: any[];
  rowCount: number;
  fields?: FieldInfo[];
}

export interface FieldInfo {
  name: string;
  dataType: string;
}

export interface TestConnectionResult {
  success: boolean;
  message?: string;
  error?: string;
  latencyMs?: number;
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'down';
  message?: string;
  latencyMs?: number;
  timestamp: Date;
}

export interface ImportOptions {
  batchSize?: number;
  mode?: 'insert' | 'upsert' | 'replace';
  onProgress?: (progress: ImportProgress) => void;
  onError?: (error: ImportError) => void;
}

export interface ImportProgress {
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  percentage: number;
}

export interface ImportError {
  row: number;
  error: string;
  data?: any;
}

export interface ImportResult {
  success: boolean;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: ImportError[];
  durationMs: number;
}

/**
 * IConnector Interface
 * 
 * All database connectors must implement this interface to ensure
 * consistent behavior across different database types.
 */
export interface IConnector {
  /**
   * Test the database connection
   * @param config Connection configuration
   * @returns Promise resolving to test result
   */
  test(config: ConnectionConfig): Promise<TestConnectionResult>;

  /**
   * Discover schema information from the database
   * @param config Connection configuration
   * @returns Promise resolving to schema information
   */
  introspect(config: ConnectionConfig): Promise<SchemaInfo>;

  /**
   * Execute a query against the database
   * @param config Connection configuration
   * @param query SQL query or database-specific query
   * @param params Query parameters
   * @returns Promise resolving to query results
   */
  query(config: ConnectionConfig, query: string, params?: any[]): Promise<QueryResult>;

  /**
   * Import data into the database
   * @param config Connection configuration
   * @param tableName Target table name
   * @param data Array of data rows to import
   * @param options Import options
   * @returns Promise resolving to import result
   */
  import(
    config: ConnectionConfig,
    tableName: string,
    data: any[],
    options?: ImportOptions
  ): Promise<ImportResult>;

  /**
   * Perform a health check on the database connection
   * @param config Connection configuration
   * @returns Promise resolving to health check result
   */
  health(config: ConnectionConfig): Promise<HealthCheckResult>;

  /**
   * Close all connections and clean up resources
   */
  disconnect(): Promise<void>;
}

/**
 * Connector Type Enum
 */
export enum ConnectorType {
  POSTGRESQL = 'postgresql',
  MYSQL = 'mysql',
  SQLSERVER = 'sqlserver',
  ORACLE = 'oracle',
  MONGODB = 'mongodb',
  CASSANDRA = 'cassandra',
  CLICKHOUSE = 'clickhouse',
}

/**
 * Canonical Data Types
 * 
 * Platform-standard data types that all connectors map to
 */
export enum CanonicalDataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  TIME = 'time',
  JSON = 'json',
  BINARY = 'binary',
  UNKNOWN = 'unknown',
}

