import { Request, Response, NextFunction } from 'express';
import { activityService } from '../services/activityService.js';

export class ActivityController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { workspaceId, dashboardId, limit } = req.query;
      const activities = await activityService.list({
        workspaceId: workspaceId as string | undefined,
        dashboardId: dashboardId as string | undefined,
        limit: limit ? parseInt(limit as string, 10) : 50,
      });
      res.json(activities);
    } catch (err) { next(err); }
  }
}

export const activityController = new ActivityController();

