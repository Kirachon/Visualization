import { Request, Response, NextFunction } from 'express';
import { queryOptimizerService } from '../services/queryOptimizerService.js';
import { dataSourceService } from '../services/dataSourceService.js';

export class OptimizerController {
  async analyze(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sql, connectionConfig, dataSourceId } = req.body || {};
      if (!sql || typeof sql !== 'string') { res.status(400).json({ error: 'sql is required' }); return; }

      let cfg = connectionConfig;
      if (!cfg && dataSourceId) {
        const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string);
        cfg = await dataSourceService.resolveConnectionConfigById(String(dataSourceId), tenantId);
      }

      const { plan, totalCost } = await queryOptimizerService.analyze(sql, cfg);
      const recommendations = queryOptimizerService.generateRecommendations(plan);

      // Optionally produce a conservative rewritten SQL (not executed here)
      const rewriteEnabled = (process.env.OPTIMIZER_REWRITE_ENABLE || 'false').toLowerCase() === 'true';
      const rewritten = rewriteEnabled ? queryOptimizerService.rewrite(sql, recommendations) : { sql, applied: [] };

      res.json({ plan, totalCost, recommendations, rewrittenSql: rewritten.sql, rewriteApplied: rewritten.applied });
      return;
    } catch (err) { next(err); }
  }
}

export const optimizerController = new OptimizerController();

