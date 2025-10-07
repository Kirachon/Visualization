/**
 * Connector Controller
 * 
 * Handles HTTP requests for database connector operations.
 */

import type { Request, Response } from 'express';
import { ConnectorFactory } from '../connectors/ConnectorFactory.js';
import { fileImportService } from '../services/fileImportService.js';
import { healthMonitorService } from '../services/healthMonitorService.js';
import type { ConnectionConfig } from '../connectors/IConnector.js';

/**
 * Test database connection
 * POST /api/v1/connectors/test
 */
export async function testConnection(req: Request, res: Response): Promise<void> {
  try {
    const { type, config } = req.body;

    // Get connector
    const connector = ConnectorFactory.getConnector(type);

    // Test connection
    const result = await connector.test(config as ConnectionConfig);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        latencyMs: result.latencyMs,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error: any) {
    console.error('Error testing connection:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to test connection',
    });
  }
}

/**
 * Introspect database schema
 * POST /api/v1/connectors/introspect
 */
export async function introspectSchema(req: Request, res: Response): Promise<void> {
  try {
    const { type, config } = req.body;

    // Get connector
    const connector = ConnectorFactory.getConnector(type);

    // Introspect schema
    const schemaInfo = await connector.introspect(config as ConnectionConfig);

    res.status(200).json({
      success: true,
      data: schemaInfo,
    });
  } catch (error: any) {
    console.error('Error introspecting schema:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to introspect schema',
    });
  }
}

/**
 * Start file import job
 * POST /api/v1/connectors/import
 */
export async function startImport(req: Request, res: Response): Promise<void> {
  try {
    const { dataSourceId, fileName, fileType, tableName, options } = req.body;
    const tenantId = (req as any).user?.tenantId;
    const userId = (req as any).user?.id;

    if (!tenantId || !userId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    // Create import job
    const job = await fileImportService.createJob({
      tenantId,
      dataSourceId,
      filePath: `/tmp/${fileName}`, // Adjust path as needed
      fileName,
      fileType,
      tableName,
      options,
      createdBy: userId,
    });

    // Start execution asynchronously
    fileImportService.executeJob(job.id, tenantId).catch((error) => {
      console.error(`Error executing import job ${job.id}:`, error);
    });

    res.status(202).json({
      success: true,
      message: 'Import job started',
      data: {
        jobId: job.id,
        status: job.status,
      },
    });
  } catch (error: any) {
    console.error('Error starting import:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start import',
    });
  }
}

/**
 * Get import job status and progress
 * GET /api/v1/connectors/jobs/:id
 */
export async function getImportJob(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const tenantId = (req as any).user?.tenantId;

    if (!tenantId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    const job = await fileImportService.getJob(id, tenantId);

    if (!job) {
      res.status(404).json({
        success: false,
        error: 'Import job not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error: any) {
    console.error('Error getting import job:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get import job',
    });
  }
}

/**
 * List import jobs for current tenant
 * GET /api/v1/connectors/jobs
 */
export async function listImportJobs(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = (req as any).user?.tenantId;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    if (!tenantId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    const jobs = await fileImportService.listJobs(tenantId, limit, offset);

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        limit,
        offset,
        total: jobs.length,
      },
    });
  } catch (error: any) {
    console.error('Error listing import jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to list import jobs',
    });
  }
}

/**
 * Get health status for a data source
 * GET /api/v1/connectors/health/:dataSourceId
 */
export async function getDataSourceHealth(req: Request, res: Response): Promise<void> {
  try {
    const { dataSourceId } = req.params;
    const tenantId = (req as any).user?.tenantId;

    if (!tenantId) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
      });
      return;
    }

    const health = await healthMonitorService.getDataSourceHealth(dataSourceId, tenantId);

    if (!health) {
      res.status(404).json({
        success: false,
        error: 'Data source not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: health,
    });
  } catch (error: any) {
    console.error('Error getting data source health:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get data source health',
    });
  }
}

