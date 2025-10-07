import { Request, Response, NextFunction } from 'express';
import { escalationService } from '../services/accessEscalationService.js';
import { auditService } from '../services/auditService.js';

export class RbacEscalationController {
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ error: 'unauthenticated' }); return; }
      const { resource, action, reason, ttlMs } = req.body || {};
      if (!resource || !action) { res.status(400).json({ error: 'resource and action required' }); return; }
      const esc = escalationService.create(req.user.tenantId, req.user.userId, String(resource), String(action), reason ? String(reason) : undefined, ttlMs ? Number(ttlMs) : undefined as any);
      try { await auditService.log({ tenantId: req.user.tenantId, userId: req.user.userId, action: 'access_escalation_requested', resourceType: 'permission', resourceId: `${resource}:${action}`, details: { escalationId: esc.id } }); } catch {}
      res.status(201).json(esc); return;
    } catch (err) { next(err); }
  }

  async approve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ error: 'unauthenticated' }); return; }
      const { id } = req.params;
      const esc = escalationService.approve(String(id), req.user.userId);
      if (!esc) { res.status(404).json({ error: 'not found' }); return; }
      try { await auditService.log({ tenantId: req.user.tenantId, userId: req.user.userId, action: 'access_escalation_approved', resourceType: 'permission', resourceId: `${esc.resource}:${esc.action}`, details: { escalationId: esc.id, approvedBy: req.user.userId } }); } catch {}
      res.json(esc); return;
    } catch (err) { next(err); }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ error: 'unauthenticated' }); return; }
      const items = escalationService.list(req.user.tenantId);
      res.json(items); return;
    } catch (err) { next(err); }
  }
}

export const rbacEscalationController = new RbacEscalationController();

