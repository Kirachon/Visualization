/**
 * PostgreSQLConnector
 * 
 * Connector implementation for PostgreSQL databases.
 * Supports connection pooling, schema introspection, and data import.
 */

import { Pool } from 'pg';
import { BaseConnector } from './BaseConnector.js';
import {
  ConnectionConfig,
  TestConnectionResult,
  SchemaInfo,
  SchemaDefinition,
  TableDefinition,
  ColumnDefinition,
  QueryResult,
  HealthCheckResult,
  ImportResult,
  ImportOptions,
  CanonicalDataType,
} from './IConnector.js';

export class PostgreSQLConnector extends BaseConnector {
  private pools: Map<string, Pool> = new Map();

  /**
   * Build PostgreSQL connection string
   */
  private buildConnectionString(config: ConnectionConfig): string {
    const ssl = config.ssl ? '?sslmode=require' : '';
    return `postgresql://${encodeURIComponent(config.username)}:${encodeURIComponent(config.password)}@${config.host}:${config.port}/${config.database}${ssl}`;
  }

  /**
   * Get or create connection pool
   */
  private getPool(config: ConnectionConfig): Pool {
    const key = this.getConnectionKey(config);
    
    if (!this.pools.has(key)) {
      const connectionString = this.buildConnectionString(config);
      const pool = new Pool({
        connectionString,
        max: 20,
        min: 2,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });
      this.pools.set(key, pool);
    }

    return this.pools.get(key)!;
  }

  /**
   * Test database connection
   */
  async test(config: ConnectionConfig): Promise<TestConnectionResult> {
    try {
      this.validateConfig(config);

      const { latencyMs } = await this.measureLatency(async () => {
        const connectionString = this.buildConnectionString(config);
        const pool = new Pool({
          connectionString,
          max: 1,
          connectionTimeoutMillis: 5000,
        });

        try {
          const client = await pool.connect();
          await client.query('SELECT 1');
          client.release();
          return true;
        } finally {
          await pool.end();
        }
      });

      return {
        success: true,
        message: 'Connection successful',
        latencyMs,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || String(error),
      };
    }
  }

  /**
   * Discover schema information
   */
  async introspect(config: ConnectionConfig): Promise<SchemaInfo> {
    try {
      this.validateConfig(config);
      const pool = this.getPool(config);
      const client = await pool.connect();

      try {
        // Get all schemas (excluding system schemas)
        const schemasResult = await client.query(`
          SELECT schema_name
          FROM information_schema.schemata
          WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
          ORDER BY schema_name
        `);

        const schemas: SchemaDefinition[] = [];

        for (const schemaRow of schemasResult.rows) {
          const schemaName = schemaRow.schema_name;

          // Get tables in this schema
          const tablesResult = await client.query(
            `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = $1 AND table_type = 'BASE TABLE'
            ORDER BY table_name
          `,
            [schemaName]
          );

          const tables: TableDefinition[] = [];

          for (const tableRow of tablesResult.rows) {
            const tableName = tableRow.table_name;

            // Get columns for this table
            const columnsResult = await client.query(
              `
              SELECT 
                column_name,
                data_type,
                is_nullable,
                column_default,
                character_maximum_length,
                numeric_precision,
                numeric_scale
              FROM information_schema.columns
              WHERE table_schema = $1 AND table_name = $2
              ORDER BY ordinal_position
            `,
              [schemaName, tableName]
            );

            const columns: ColumnDefinition[] = columnsResult.rows.map((col) => ({
              columnName: col.column_name,
              dataType: col.data_type,
              isNullable: col.is_nullable === 'YES',
              defaultValue: col.column_default,
              maxLength: col.character_maximum_length,
              precision: col.numeric_precision,
              scale: col.numeric_scale,
            }));

            // Get primary keys
            const pkResult = await client.query(
              `
              SELECT a.attname AS column_name
              FROM pg_index i
              JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
              WHERE i.indrelid = ($1 || '.' || $2)::regclass AND i.indisprimary
            `,
              [schemaName, tableName]
            );

            const primaryKeys = pkResult.rows.map((row) => row.column_name);

            tables.push({
              tableName,
              columns,
              primaryKeys,
            });
          }

          schemas.push({
            schemaName,
            tables,
          });
        }

        return { schemas };
      } finally {
        client.release();
      }
    } catch (error: any) {
      this.handleError(error, 'PostgreSQL introspection failed');
    }
  }

  /**
   * Execute query
   */
  async query(config: ConnectionConfig, queryText: string, params?: any[]): Promise<QueryResult> {
    try {
      this.validateConfig(config);
      const pool = this.getPool(config);
      const result = await pool.query(queryText, params);

      return {
        rows: result.rows,
        rowCount: result.rowCount || 0,
        fields: result.fields?.map((field) => ({
          name: field.name,
          dataType: field.dataTypeID.toString(),
        })),
      };
    } catch (error: any) {
      this.handleError(error, 'PostgreSQL query failed');
    }
  }

  /**
   * Import batch of data
   */
  protected async importBatch(
    config: ConnectionConfig,
    tableName: string,
    batch: any[],
    _options: ImportOptions
  ): Promise<void> {
    if (batch.length === 0) return;

    const pool = this.getPool(config);
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const columns = Object.keys(batch[0]);
      const placeholders = batch
        .map(
          (_, rowIndex) =>
            `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`
        )
        .join(', ');

      const values = batch.flatMap((row) => columns.map((col) => row[col]));

      const insertQuery = `
        INSERT INTO ${tableName} (${columns.join(', ')})
        VALUES ${placeholders}
      `;

      await client.query(insertQuery, values);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Import data
   */
  async import(
    config: ConnectionConfig,
    tableName: string,
    data: any[],
    options?: ImportOptions
  ): Promise<ImportResult> {
    return this.importWithBatching(config, tableName, data, options);
  }

  /**
   * Health check
   */
  async health(config: ConnectionConfig): Promise<HealthCheckResult> {
    try {
      const { latencyMs } = await this.measureLatency(async () => {
        const pool = this.getPool(config);
        const client = await pool.connect();
        try {
          await client.query('SELECT 1');
          return true;
        } finally {
          client.release();
        }
      });

      return {
        status: latencyMs < 1000 ? 'healthy' : 'degraded',
        latencyMs,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        status: 'down',
        message: error.message || String(error),
        timestamp: new Date(),
      };
    }
  }

  /**
   * Map PostgreSQL types to canonical types
   */
  protected mapToCanonicalType(dbType: string): CanonicalDataType {
    const type = dbType.toLowerCase();
    
    if (type.includes('char') || type.includes('text')) return CanonicalDataType.STRING;
    if (type.includes('int') || type.includes('numeric') || type.includes('decimal') || type.includes('float') || type.includes('double')) return CanonicalDataType.NUMBER;
    if (type.includes('bool')) return CanonicalDataType.BOOLEAN;
    if (type === 'date') return CanonicalDataType.DATE;
    if (type.includes('timestamp') || type.includes('datetime')) return CanonicalDataType.DATETIME;
    if (type === 'time') return CanonicalDataType.TIME;
    if (type.includes('json')) return CanonicalDataType.JSON;
    if (type.includes('bytea') || type.includes('blob')) return CanonicalDataType.BINARY;
    
    return CanonicalDataType.UNKNOWN;
  }

  /**
   * Disconnect all pools
   */
  async disconnect(): Promise<void> {
    const disconnectPromises = Array.from(this.pools.values()).map((pool) => pool.end());
    await Promise.all(disconnectPromises);
    this.pools.clear();
  }
}

