import { Request, Response, NextFunction } from 'express';
import { maskingService } from '../services/maskingService.js';

export class MaskingController {
  async dryRun(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId || req.body.tenantId;
      const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
      const masked = await maskingService.maskRows(tenantId, rows);
      res.json({ rows: masked });
    } catch (err) { next(err); }
  }
}

export const maskingController = new MaskingController();

