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

  // Members
  async listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { workspaceMemberService } = await import('../services/workspaceMemberService.js');
      const members = await workspaceMemberService.listMembers(id);
      res.json(members);
    } catch (err) { next(err); }
  }

  async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { userId, role } = req.body;
      if (!userId || !role) { res.status(400).json({ error: 'userId and role required' }); return; }
      const { workspaceMemberService } = await import('../services/workspaceMemberService.js');
      const actor = req.user!.userId;
      const m = await workspaceMemberService.addMember({ workspaceId: id, userId, role, addedBy: actor });
      res.status(201).json(m);
    } catch (err) { next(err); }
  }

  async updateMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, userId } = req.params;
      const { role } = req.body;
      if (!role) { res.status(400).json({ error: 'role required' }); return; }
      const { workspaceMemberService } = await import('../services/workspaceMemberService.js');
      const m = await workspaceMemberService.updateRole(id, userId, role);
      if (!m) { res.status(404).json({ error: 'Member not found' }); return; }
      res.json(m);
    } catch (err) { next(err); }
  }

  async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, userId } = req.params;
      const { workspaceMemberService } = await import('../services/workspaceMemberService.js');
      const ok = await workspaceMemberService.removeMember(id, userId);
      if (!ok) { res.status(404).json({ error: 'Member not found' }); return; }
      res.status(204).send();
    } catch (err) { next(err); }
  }
}

export const workspaceController = new WorkspaceController();

