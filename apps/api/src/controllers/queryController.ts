import { Request, Response, NextFunction } from 'express';
import { queryService } from '../services/queryService.js';
import { dataSourceService } from '../services/dataSourceService.js';
import { perfService } from '../services/perfService.js';
import crypto from 'crypto';

export const executeQuery = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { connectionConfig, sql, params, limit, offset, timeoutMs } = req.body;

    let cfg = connectionConfig;
    if (!cfg) {
      const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string);
      cfg = await dataSourceService.resolveConnectionConfigById(req.params.id, tenantId);
      if (!cfg) return res.status(404).json({ error: 'Data source not found' });
    }

    const result = await queryService.execute({ connectionConfig: cfg, sql, params, limit, offset, timeoutMs });

    // Map to frontend contract and add minimal metadata for perf UI
    const executionTime = (result as any).durationMs ?? 0;
    const sqlHash = crypto.createHash('sha1').update(sql).digest('hex');

    // Record for perf endpoints
    perfService.record(sql, executionTime);

    res.json({
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
  }
};

