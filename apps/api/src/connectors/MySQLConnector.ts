/**
 * MySQLConnector
 * 
 * Connector implementation for MySQL databases.
 * Supports connection pooling, schema introspection, and data import.
 */

import mysql from 'mysql2/promise';
import { BaseConnector } from './BaseConnector.js';
import {
  ConnectionConfig,
  TestConnectionResult,
  SchemaInfo,
  TableDefinition,
  ColumnDefinition,
  QueryResult,
  HealthCheckResult,
  ImportResult,
  ImportOptions,
  CanonicalDataType,
} from './IConnector.js';

export class MySQLConnector extends BaseConnector {
  private pools: Map<string, mysql.Pool> = new Map();

  /**
   * Get or create connection pool
   */
  private getPool(config: ConnectionConfig): mysql.Pool {
    const key = this.getConnectionKey(config);
    
    if (!this.pools.has(key)) {
      const pool = mysql.createPool({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.database,
        waitForConnections: true,
        connectionLimit: 20,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
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
        const connection = await mysql.createConnection({
          host: config.host,
          port: config.port,
          user: config.username,
          password: config.password,
          database: config.database,
          connectTimeout: 5000,
          ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
        });

        try {
          await connection.query('SELECT 1');
          return true;
        } finally {
          await connection.end();
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
      const connection = await pool.getConnection();

      try {
        // In MySQL, database = schema
        const schemaName = config.database;

        // Get all tables
        const [tables] = await connection.query<any[]>(
          `
          SELECT table_name
          FROM information_schema.tables
          WHERE table_schema = ? AND table_type = 'BASE TABLE'
          ORDER BY table_name
        `,
          [schemaName]
        );

        const tableDefinitions: TableDefinition[] = [];

        for (const tableRow of tables) {
          const tableName = tableRow.table_name || tableRow.TABLE_NAME;

          // Get columns for this table
          const [columns] = await connection.query<any[]>(
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
            WHERE table_schema = ? AND table_name = ?
            ORDER BY ordinal_position
          `,
            [schemaName, tableName]
          );

          const columnDefinitions: ColumnDefinition[] = columns.map((col) => ({
            columnName: col.column_name || col.COLUMN_NAME,
            dataType: col.data_type || col.DATA_TYPE,
            isNullable: (col.is_nullable || col.IS_NULLABLE) === 'YES',
            defaultValue: col.column_default || col.COLUMN_DEFAULT,
            maxLength: col.character_maximum_length || col.CHARACTER_MAXIMUM_LENGTH,
            precision: col.numeric_precision || col.NUMERIC_PRECISION,
            scale: col.numeric_scale || col.NUMERIC_SCALE,
          }));

          // Get primary keys
          const [pkRows] = await connection.query<any[]>(
            `
            SELECT column_name
            FROM information_schema.key_column_usage
            WHERE table_schema = ? AND table_name = ? AND constraint_name = 'PRIMARY'
            ORDER BY ordinal_position
          `,
            [schemaName, tableName]
          );

          const primaryKeys = pkRows.map((row) => row.column_name || row.COLUMN_NAME);

          tableDefinitions.push({
            tableName,
            columns: columnDefinitions,
            primaryKeys,
          });
        }

        return {
          schemas: [
            {
              schemaName,
              tables: tableDefinitions,
            },
          ],
        };
      } finally {
        connection.release();
      }
    } catch (error: any) {
      this.handleError(error, 'MySQL introspection failed');
    }
  }

  /**
   * Execute query
   */
  async query(config: ConnectionConfig, queryText: string, params?: any[]): Promise<QueryResult> {
    try {
      this.validateConfig(config);
      const pool = this.getPool(config);
      const [rows, fields] = await pool.query(queryText, params);

      return {
        rows: Array.isArray(rows) ? rows : [],
        rowCount: Array.isArray(rows) ? rows.length : 0,
        fields: Array.isArray(fields)
          ? fields.map((field: any) => ({
              name: field.name,
              dataType: field.type?.toString() || 'unknown',
            }))
          : undefined,
      };
    } catch (error: any) {
      this.handleError(error, 'MySQL query failed');
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
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const columns = Object.keys(batch[0]);
      const placeholders = batch.map(() => `(${columns.map(() => '?').join(', ')})`).join(', ');
      const values = batch.flatMap((row) => columns.map((col) => row[col]));

      const insertQuery = `
        INSERT INTO ${tableName} (${columns.map((col) => `\`${col}\``).join(', ')})
        VALUES ${placeholders}
      `;

      await connection.query(insertQuery, values);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
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
        const connection = await pool.getConnection();
        try {
          await connection.query('SELECT 1');
          return true;
        } finally {
          connection.release();
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
   * Map MySQL types to canonical types
   */
  protected mapToCanonicalType(dbType: string): CanonicalDataType {
    const type = dbType.toLowerCase();
    
    if (type.includes('char') || type.includes('text') || type.includes('enum') || type.includes('set')) return CanonicalDataType.STRING;
    if (type.includes('int') || type.includes('decimal') || type.includes('numeric') || type.includes('float') || type.includes('double')) return CanonicalDataType.NUMBER;
    if (type.includes('bool') || type === 'tinyint(1)') return CanonicalDataType.BOOLEAN;
    if (type === 'date') return CanonicalDataType.DATE;
    if (type.includes('timestamp') || type.includes('datetime')) return CanonicalDataType.DATETIME;
    if (type === 'time') return CanonicalDataType.TIME;
    if (type.includes('json')) return CanonicalDataType.JSON;
    if (type.includes('blob') || type.includes('binary')) return CanonicalDataType.BINARY;
    
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

