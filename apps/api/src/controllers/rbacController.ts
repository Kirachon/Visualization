import { Request, Response, NextFunction } from 'express';
import { rbacService } from '../services/rbacService.js';

export class RBACController {
  async listRoles(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await rbacService.getRoles();
      res.json(roles);
    } catch (err) { next(err); }
  }

  async createRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description, inheritsFrom } = req.body || {};
      if (!name || typeof name !== 'string') { res.status(400).json({ error: 'name is required' }); return; }
      const createdBy = (req as any).user?.userId || 'system';
      const role = await rbacService.createRole(name, description || '', Array.isArray(inheritsFrom) ? inheritsFrom : [], createdBy);
      res.status(201).json(role);
    } catch (err) { next(err); }
  }

  async getRolePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const perms = await rbacService.getRolePermissions(id);
      res.json(perms);
    } catch (err) { next(err); }
  }

  async assignRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, roleId, tenantId, expiresAt } = req.body || {};
      if (!userId || !roleId || !tenantId) { res.status(400).json({ error: 'userId, roleId, tenantId are required' }); return; }
      const actor = (req as any).user?.userId || 'system';
      await rbacService.assignRole(userId, roleId, tenantId, actor, expiresAt ? new Date(expiresAt) : undefined);
      res.status(204).end();
    } catch (err) { next(err); }
  }

  async revokeRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId, roleId, tenantId } = req.body || {};
      if (!userId || !roleId || !tenantId) { res.status(400).json({ error: 'userId, roleId, tenantId are required' }); return; }
      const actor = (req as any).user?.userId || 'system';
      await rbacService.revokeRole(userId, roleId, tenantId, actor);
      res.status(204).end();
    } catch (err) { next(err); }
  }
}

export const rbacController = new RBACController();

