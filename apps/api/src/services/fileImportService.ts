/**
 * FileImportService
 * 
 * Service for importing data from files (CSV, JSON) into databases.
 * Supports streaming, progress tracking, and error handling.
 */

import fs from 'fs';
import csv from 'csv-parser';
import { query } from '../database/connection.js';
import { ConnectorFactory } from '../connectors/ConnectorFactory.js';
import type { ConnectionConfig, ImportOptions, ImportProgress } from '../connectors/IConnector.js';

export interface FileImportJob {
  id: string;
  tenantId: string;
  dataSourceId?: string;
  fileName: string;
  fileSize?: number;
  fileType: string;
  tableName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: ImportProgress;
  errorCount: number;
  errors: any[];
  options: any;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface StartImportInput {
  tenantId: string;
  dataSourceId: string;
  filePath: string;
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
  createdBy: string;
}

export class FileImportService {
  /**
   * Create a new import job
   */
  async createJob(input: StartImportInput): Promise<FileImportJob> {
    const fileStats = fs.statSync(input.filePath);

    const result = await query(
      `INSERT INTO import_jobs (
        tenant_id, data_source_id, file_name, file_size, file_type, 
        table_name, status, options, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        input.tenantId,
        input.dataSourceId,
        input.fileName,
        fileStats.size,
        input.fileType,
        input.tableName,
        'pending',
        JSON.stringify(input.options || {}),
        input.createdBy,
      ]
    );

    return this.mapRowToJob(result.rows[0]);
  }

  /**
   * Get import job by ID
   */
  async getJob(jobId: string, tenantId: string): Promise<FileImportJob | null> {
    const result = await query(
      `SELECT * FROM import_jobs WHERE id = $1 AND tenant_id = $2`,
      [jobId, tenantId]
    );

    if (result.rows.length === 0) return null;
    return this.mapRowToJob(result.rows[0]);
  }

  /**
   * Update import job status and progress
   */
  async updateJob(
    jobId: string,
    updates: {
      status?: string;
      progress?: ImportProgress;
      errorCount?: number;
      errors?: any[];
      startedAt?: Date;
      completedAt?: Date;
    }
  ): Promise<void> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.status) {
      setClauses.push(`status = $${paramIndex++}`);
      values.push(updates.status);
    }

    if (updates.progress) {
      setClauses.push(`progress = $${paramIndex++}`);
      values.push(JSON.stringify(updates.progress));
    }

    if (updates.errorCount !== undefined) {
      setClauses.push(`error_count = $${paramIndex++}`);
      values.push(updates.errorCount);
    }

    if (updates.errors) {
      setClauses.push(`errors = $${paramIndex++}`);
      values.push(JSON.stringify(updates.errors));
    }

    if (updates.startedAt) {
      setClauses.push(`started_at = $${paramIndex++}`);
      values.push(updates.startedAt);
    }

    if (updates.completedAt) {
      setClauses.push(`completed_at = $${paramIndex++}`);
      values.push(updates.completedAt);
    }

    if (setClauses.length === 0) return;

    values.push(jobId);
    await query(
      `UPDATE import_jobs SET ${setClauses.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
      values
    );
  }

  /**
   * Start import job execution
   */
  async executeJob(jobId: string, tenantId: string): Promise<void> {
    const job = await this.getJob(jobId, tenantId);
    if (!job) throw new Error('Job not found');

    if (job.status !== 'pending') {
      throw new Error(`Job is not in pending status: ${job.status}`);
    }

    // Update status to running
    await this.updateJob(jobId, {
      status: 'running',
      startedAt: new Date(),
    });

    try {
      // Get data source configuration
      const dsResult = await query(
        `SELECT * FROM data_sources WHERE id = $1 AND tenant_id = $2`,
        [job.dataSourceId, tenantId]
      );

      if (dsResult.rows.length === 0) {
        throw new Error('Data source not found');
      }

      const dataSource = dsResult.rows[0];
      const config: ConnectionConfig = dataSource.connection_config;

      // Get connector
      const connector = ConnectorFactory.getConnector(dataSource.type);

      // Parse file and import data
      const filePath = `/tmp/${job.fileName}`; // Adjust path as needed
      const data = await this.parseFile(filePath, job.fileType, job.options);

      // Import data with progress tracking
      const importOptions: ImportOptions = {
        batchSize: job.options.batchSize || 1000,
        mode: job.options.mode || 'insert',
        onProgress: async (progress) => {
          await this.updateJob(jobId, { progress });
        },
      };

      const result = await connector.import(config, job.tableName, data, importOptions);

      // Update job with final status
      await this.updateJob(jobId, {
        status: result.success ? 'completed' : 'failed',
        progress: {
          totalRows: result.totalRows,
          processedRows: result.totalRows,
          successfulRows: result.successfulRows,
          failedRows: result.failedRows,
          percentage: 100,
        },
        errorCount: result.failedRows,
        errors: result.errors,
        completedAt: new Date(),
      });
    } catch (error: any) {
      await this.updateJob(jobId, {
        status: 'failed',
        errors: [{ error: error.message || String(error) }],
        completedAt: new Date(),
      });
      throw error;
    }
  }

  /**
   * Parse file based on type
   */
  private async parseFile(filePath: string, fileType: string, options: any): Promise<any[]> {
    if (fileType === 'csv') {
      return this.parseCSV(filePath, options);
    } else if (fileType === 'json') {
      return this.parseJSON(filePath);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }

  /**
   * Parse CSV file
   */
  private async parseCSV(filePath: string, options: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const data: any[] = [];

      fs.createReadStream(filePath)
        .pipe(csv({ separator: options.delimiter || ',', headers: options.hasHeader !== false }))
        .on('data', (row: any) => {
          // Apply column mapping if provided
          if (options.columnMapping) {
            const mappedRow: any = {};
            for (const [sourceCol, targetCol] of Object.entries(options.columnMapping as Record<string, string>)) {
              mappedRow[targetCol as string] = (row as any)[sourceCol as string];
            }
            data.push(mappedRow);
          } else {
            data.push(row);
          }
        })
        .on('end', () => resolve(data))
        .on('error', (error: any) => reject(error));
    });
  }

  /**
   * Parse JSON file
   */
  private async parseJSON(filePath: string): Promise<any[]> {
    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [parsed];
  }

  /**
   * Map database row to FileImportJob
   */
  private mapRowToJob(row: any): FileImportJob {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      dataSourceId: row.data_source_id,
      fileName: row.file_name,
      fileSize: row.file_size,
      fileType: row.file_type,
      tableName: row.table_name,
      status: row.status,
      progress: typeof row.progress === 'string' ? JSON.parse(row.progress) : row.progress,
      errorCount: row.error_count,
      errors: typeof row.errors === 'string' ? JSON.parse(row.errors) : row.errors,
      options: typeof row.options === 'string' ? JSON.parse(row.options) : row.options,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
    };
  }

  /**
   * List import jobs for a tenant
   */
  async listJobs(tenantId: string, limit: number = 50, offset: number = 0): Promise<FileImportJob[]> {
    const result = await query(
      `SELECT * FROM import_jobs 
       WHERE tenant_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    );

    return result.rows.map((row) => this.mapRowToJob(row));
  }
}

export const fileImportService = new FileImportService();

