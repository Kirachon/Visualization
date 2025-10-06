import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboardService.js';

export const createDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId || req.body.tenantId;
    const ownerId = (req as any).user?.userId || req.body.ownerId;
    const { tenantId: _, ownerId: __, ...input } = req.body;
    const dashboard = await dashboardService.create(tenantId, ownerId, input);
    res.status(201).json(dashboard);
  } catch (err) {
    next(err);
  }
};

export const listDashboards = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string);
    const ownerId = req.query.ownerId as string | undefined;
    const list = await dashboardService.list(tenantId, ownerId);
    res.json(list);
  } catch (err) {
    next(err);
  }
};

export const getDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string);
    const dashboard = await dashboardService.getById(req.params.id, tenantId);
    if (!dashboard) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(dashboard);
    return;
  } catch (err) {
    next(err);
  }
};

export const updateDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId || req.body.tenantId;
    const { tenantId: _, ...input } = req.body;
    const dashboard = await dashboardService.update(req.params.id, tenantId, input);
    if (!dashboard) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(dashboard);
    return;
  } catch (err) {
    next(err);
  }
};

export const deleteDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string);
    const ok = await dashboardService.remove(req.params.id, tenantId);
    if (!ok) { res.status(404).json({ error: 'Not found' }); return; }
    res.status(204).send();
    return;
  } catch (err) {
    next(err);
  }
};

