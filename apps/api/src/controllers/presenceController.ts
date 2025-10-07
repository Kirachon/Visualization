import { Request, Response, NextFunction } from 'express';
import { presenceService } from '../services/presenceService.js';

export class PresenceController {
  async listActive(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dashboardId } = req.params;
      const rawWithin = req.query.withinSeconds ? parseInt(req.query.withinSeconds as string, 10) : 60;
      const withinSeconds = Math.min(Math.max(isNaN(rawWithin) ? 60 : rawWithin, 5), 600);
      const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string);
      if (!tenantId) { res.status(400).json({ error: 'tenantId required' }); return; }
      if (!dashboardId) { res.status(400).json({ error: 'dashboardId required' }); return; }
      const items = await presenceService.getActiveUsers({ tenantId, dashboardId, withinSeconds });
      res.json(items);
    } catch (err) { next(err); }
  }
}

export const presenceController = new PresenceController();

