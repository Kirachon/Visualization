import { Request, Response, NextFunction } from 'express';
import { workspaceService } from '../services/workspaceService.js';

export class WorkspaceController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, settings } = req.body;
      if (!name) { res.status(400).json({ error: 'name required' }); return; }
      const ownerId = req.user!.userId;
      const workspace = await workspaceService.create({ name, ownerId, settings });
      res.status(201).json(workspace);
    } catch (err) { next(err); }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const ownerId = req.query.ownerId as string | undefined;
      const workspaces = await workspaceService.list(ownerId);
      res.json(workspaces);
    } catch (err) { next(err); }
  }

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const workspace = await workspaceService.getById(id);
      if (!workspace) { res.status(404).json({ error: 'Workspace not found' }); return; }
      res.json(workspace);
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { name, settings } = req.body;
      const workspace = await workspaceService.update(id, { name, settings });
      if (!workspace) { res.status(404).json({ error: 'Workspace not found' }); return; }
      res.json(workspace);
    } catch (err) { next(err); }
  }

  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const ok = await workspaceService.remove(id);
      if (!ok) { res.status(404).json({ error: 'Workspace not found' }); return; }
      res.status(204).send();
    } catch (err) { next(err); }
  }
}

export const workspaceController = new WorkspaceController();

