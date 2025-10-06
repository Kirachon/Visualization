import { Request, Response, NextFunction } from 'express';
import { versionService } from '../services/versionService.js';

export class VersionController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dashboardId } = req.params;
      const { diff, label } = req.body;
      if (!diff) { res.status(400).json({ error: 'diff required' }); return; }
      const authorId = req.user!.userId;
      const version = await versionService.create({ dashboardId, diff, label, authorId });
      res.status(201).json(version);
    } catch (err) { next(err); }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dashboardId } = req.params;
      const versions = await versionService.list(dashboardId);
      res.json(versions);
    } catch (err) { next(err); }
  }

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const version = await versionService.getById(id);
      if (!version) { res.status(404).json({ error: 'Version not found' }); return; }
      res.json(version);
    } catch (err) { next(err); }
  }
}

export const versionController = new VersionController();

