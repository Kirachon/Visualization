import { Request, Response, NextFunction } from 'express';
import { pipelineService } from '../services/pipelineService.js';

export class PipelineController {
  async validate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.PIPELINES_VALIDATE_API || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }
      const start = Date.now();
      const result = pipelineService.validateDAG(req.body);
      const dur = Date.now() - start;
      try {
        const { pipelineValidationLatency, pipelineValidationErrors } = await import('../utils/metrics.js');
        pipelineValidationLatency.labels(result.valid ? 'ok' : 'error').observe(dur);
        if (!result.valid) pipelineValidationErrors.labels('validation').inc();
      } catch {}
      res.json(result);
    } catch (err) { next(err); }
  }

  /**
   * plan endpoint computes execution stages for a pipeline without executing it.
   * Feature-flagged behind PIPELINES_PLAN_API (default OFF).
   */
  async plan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.PIPELINES_PLAN_API || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const start = Date.now();
      const result = pipelineService.planExecution(req.body);
      const dur = Date.now() - start;

      // Record metrics (reuse validation metrics for now; can add plan-specific metrics later)
      try {
        const { pipelineValidationLatency, pipelineValidationErrors } = await import('../utils/metrics.js');
        pipelineValidationLatency.labels(result.valid ? 'ok' : 'error').observe(dur);
        if (!result.valid) pipelineValidationErrors.labels('planning').inc();
      } catch {}

      res.json(result);
    } catch (err) { next(err); }
  }

  /**
   * listTransforms endpoint returns available transform operations.
   * Feature-flagged behind PIPELINES_TRANSFORMS_API (default OFF).
   */
  async listTransforms(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.PIPELINES_TRANSFORMS_API || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const { listTransforms } = await import('../services/transformRegistry.js');
      const transforms = listTransforms();

      // Return transforms with their schemas
      res.json({
        transforms: transforms.map(t => ({
          name: t.name,
          description: t.description,
          configSchema: t.configSchema,
        })),
      });
    } catch (err) { next(err); }
  }
}

export const pipelineController = new PipelineController();

