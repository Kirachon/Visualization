/**
 * BaseConnector
 * 
 * Abstract base class providing common functionality for all database connectors.
 * Implements shared logic for connection pooling, error handling, and utilities.
 */

import {
  IConnector,
  ConnectionConfig,
  TestConnectionResult,
  HealthCheckResult,
  ImportResult,
  ImportOptions,
  ImportProgress,
  ImportError,
  CanonicalDataType,
} from './IConnector.js';

export abstract class BaseConnector implements IConnector {
  protected connectionPools: Map<string, any> = new Map();

  /**
   * Generate a unique key for connection pooling
   */
  protected getConnectionKey(config: ConnectionConfig): string {
    return `${config.host}:${config.port}/${config.database}`;
  }

  /**
   * Map database-specific data type to canonical type
   * Must be implemented by each connector
   */
  protected abstract mapToCanonicalType(dbType: string): CanonicalDataType;

  /**
   * Measure execution time of an async operation
   */
  protected async measureLatency<T>(operation: () => Promise<T>): Promise<{ result: T; latencyMs: number }> {
    const startTime = Date.now();
    const result = await operation();
    const latencyMs = Date.now() - startTime;
    return { result, latencyMs };
  }

  /**
   * Handle errors consistently across connectors
   */
  protected handleError(error: any, context: string): never {
    const errorMessage = error.message || String(error);
    throw new Error(`${context}: ${errorMessage}`);
  }

  /**
   * Validate connection configuration
   */
  protected validateConfig(config: ConnectionConfig): void {
    if (!config.host) throw new Error('Host is required');
    if (!config.port) throw new Error('Port is required');
    if (!config.database) throw new Error('Database is required');
    if (!config.username) throw new Error('Username is required');
    // Password is optional (some databases support trust authentication)
  }

  /**
   * Batch data for import operations
   */
  protected batchData<T>(data: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < data.length; i += batchSize) {
      batches.push(data.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Calculate import progress
   */
  protected calculateProgress(
    totalRows: number,
    processedRows: number,
    successfulRows: number,
    failedRows: number
  ): ImportProgress {
    return {
      totalRows,
      processedRows,
      successfulRows,
      failedRows,
      percentage: totalRows > 0 ? Math.round((processedRows / totalRows) * 100) : 0,
    };
  }

  /**
   * Default implementation of import with batching
   * Can be overridden by specific connectors for optimized implementations
   */
  protected async importWithBatching(
    config: ConnectionConfig,
    tableName: string,
    data: any[],
    options: ImportOptions = {}
  ): Promise<ImportResult> {
    const startTime = Date.now();
    const batchSize = options.batchSize || 1000;
    const batches = this.batchData(data, batchSize);

    let successfulRows = 0;
    let failedRows = 0;
    const errors: ImportError[] = [];

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const batchStartRow = batchIndex * batchSize;

      try {
        // This should be implemented by each connector
        await this.importBatch(config, tableName, batch, options);
        successfulRows += batch.length;
      } catch (error: any) {
        failedRows += batch.length;
        errors.push({
          row: batchStartRow,
          error: error.message || String(error),
          data: batch,
        });
      }

      // Report progress
      if (options.onProgress) {
        const progress = this.calculateProgress(
          data.length,
          (batchIndex + 1) * batchSize,
          successfulRows,
          failedRows
        );
        options.onProgress(progress);
      }
    }

    const durationMs = Date.now() - startTime;

    return {
      success: failedRows === 0,
      totalRows: data.length,
      successfulRows,
      failedRows,
      errors,
      durationMs,
    };
  }

  /**
   * Import a single batch - must be implemented by each connector
   */
  protected abstract importBatch(
    config: ConnectionConfig,
    tableName: string,
    batch: any[],
    options: ImportOptions
  ): Promise<void>;

  // Abstract methods that must be implemented by each connector
  abstract test(config: ConnectionConfig): Promise<TestConnectionResult>;
  abstract introspect(config: ConnectionConfig): Promise<any>;
  abstract query(config: ConnectionConfig, query: string, params?: any[]): Promise<any>;
  abstract import(
    config: ConnectionConfig,
    tableName: string,
    data: any[],
    options?: ImportOptions
  ): Promise<ImportResult>;
  abstract health(config: ConnectionConfig): Promise<HealthCheckResult>;
  abstract disconnect(): Promise<void>;
}

