import { Request, Response, NextFunction } from 'express';
import { mvCatalogService } from '../services/mvCatalogService.js';
import { refreshOnce } from '../services/mvSchedulerService.js';

export const createMV = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string) || 'tenant-test';
    const rec = await mvCatalogService.create(tenantId, req.body || {});
    res.status(201).json(rec);
  } catch (e) { next(e); }
};

export const listMV = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string) || 'tenant-test';
    const enabled = req.query.enabled ? String(req.query.enabled).toLowerCase() === 'true' : undefined;
    const proposed = req.query.proposed ? String(req.query.proposed).toLowerCase() === 'true' : undefined;
    const recs = await mvCatalogService.list(tenantId, { enabled, proposed });
    res.json(recs);
  } catch (e) { next(e); }
};

export const getMV = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string) || 'tenant-test';
    const rec = await mvCatalogService.get(tenantId, req.params.id);
    if (!rec) return void res.status(404).json({ error: 'Not found' });
    res.json(rec);
  } catch (e) { next(e); }
};

export const updateMV = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string) || 'tenant-test';
    const rec = await mvCatalogService.update(tenantId, req.params.id, req.body || {});
    if (!rec) return void res.status(404).json({ error: 'Not found' });
    res.json(rec);
  } catch (e) { next(e); }
};

export const deleteMV = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string) || 'tenant-test';
    await mvCatalogService.remove(tenantId, req.params.id);
    res.status(204).end();
  } catch (e) { next(e); }
};

export const refreshMV = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string) || 'tenant-test';
    const rec = await mvCatalogService.get(tenantId, req.params.id);
    if (!rec) return void res.status(404).json({ error: 'Not found' });
    const status = await refreshOnce(tenantId, req.params.id);
    res.json({ id: req.params.id, status });
  } catch (e) { next(e); }
};

