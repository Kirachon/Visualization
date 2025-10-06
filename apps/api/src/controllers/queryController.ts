import { Request, Response, NextFunction } from 'express';
import { queryService } from '../services/queryService.js';
import { dataSourceService } from '../services/dataSourceService.js';
import { perfService } from '../services/perfService.js';
import { auditService } from '../services/auditService.js';
import crypto from 'crypto';

export const executeQuery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { connectionConfig, sql, params, limit, offset, timeoutMs } = req.body;

    let cfg = connectionConfig;
    if (!cfg) {
      const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string);
      cfg = await dataSourceService.resolveConnectionConfigById(req.params.id, tenantId);
      if (!cfg) { res.status(404).json({ error: 'Data source not found' }); return; }
    }

    const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string);
    const userClaims = {
      tenantId,
      department: (req as any).user?.department || null,
      region: (req as any).user?.region || null,
    } as any;

    const result = await queryService.execute({ connectionConfig: cfg, sql, params, limit, offset, timeoutMs, tenantId, userClaims });

    // Map to frontend contract and add minimal metadata for perf UI
    const executionTime = (result as any).durationMs ?? 0;
    const sqlHash = crypto.createHash('sha1').update(sql).digest('hex');

    // Record for perf endpoints
    perfService.record(sql, executionTime);

    // Audit (feature-flagged hash chain)
    await auditService.log({
      tenantId,
      userId: (req as any).user?.userId || null,
      action: 'query.execute',
      resourceType: 'data',
      // omit resourceId to keep undefined (not null) per model
      // resourceId: undefined,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'] as string | undefined,
      details: { sqlHash, rowCount: result.rowCount, durationMs: executionTime },
    });

    return void res.json({
      rows: result.rows,
      rowCount: result.rowCount,
      executionTime,
      metadata: {
        engine: 'oltp',
        cacheHit: false,
        sqlHash,
      },
    });
  } catch (err) {
    next(err);
    return;
  }
};

