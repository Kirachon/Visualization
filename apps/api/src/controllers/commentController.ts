import { Request, Response, NextFunction } from 'express';
import { commentService } from '../services/commentService.js';

export class CommentController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dashboardId, body, mentions } = req.body;
      if (!dashboardId || !body) { res.status(400).json({ error: 'dashboardId and body required' }); return; }
      const userId = req.user!.userId;
      const comment = await commentService.create({ dashboardId, userId, body, mentions });
      res.status(201).json(comment);
    } catch (err) { next(err); }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dashboardId } = req.query;
      if (!dashboardId) { res.status(400).json({ error: 'dashboardId required' }); return; }
      const comments = await commentService.list(dashboardId as string);
      res.json(comments);
    } catch (err) { next(err); }
  }

  async resolve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const ok = await commentService.resolve(id);
      if (!ok) { res.status(404).json({ error: 'Comment not found' }); return; }
      res.status(204).send();
    } catch (err) { next(err); }
  }
}

export const commentController = new CommentController();

