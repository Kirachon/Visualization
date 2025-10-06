import { Request, Response, NextFunction } from 'express';
import { shareService, ShareLevel } from '../services/shareService.js';

export function requireShareLevel(required: ShareLevel) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if ((process.env.SHARING_STRICT_ENFORCEMENT || 'false').toLowerCase() !== 'true') { next(); return; }
      const user = (req as any).user;
      if (!user) { res.status(401).json({ error: 'Unauthorized' }); return; }
      const dashId = req.params.dashboardId || req.body.dashboardId || req.query.dashboardId as string;
      if (!dashId) { res.status(400).json({ error: 'dashboardId required' }); return; }
      const level = await shareService.getLevelForUser(dashId, user.userId, user.roles || []);
      if (!level || !shareService.hasAtLeast(level, required)) { res.status(403).json({ error: 'Forbidden' }); return; }
      next();
    } catch (e) { next(e); }
  };
}

