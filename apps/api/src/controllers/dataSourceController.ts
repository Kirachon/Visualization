import { Request, Response, NextFunction } from 'express';
import { dataSourceService } from '../services/dataSourceService.js';

export const createDataSource = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user?.tenantId || req.body.tenantId; // fallback for tests
    const ownerId = (req as any).user?.userId || req.body.ownerId; // fallback for tests
    const { tenantId: _, ownerId: __, ...input } = req.body;
    const ds = await dataSourceService.create(tenantId, ownerId, input);
    res.status(201).json(ds);
  } catch (err) {
    next(err);
  }
};

export const listDataSources = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string);
    const list = await dataSourceService.list(tenantId);
    res.json(list);
  } catch (err) {
    next(err);
  }
};

export const getDataSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string);
    const ds = await dataSourceService.getById(req.params.id, tenantId);
    if (!ds) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(ds);
    return;
  } catch (err) {
    next(err);
  }
};

export const updateDataSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId || req.body.tenantId;
    const { tenantId: _, ...input } = req.body;
    const ds = await dataSourceService.update(req.params.id, tenantId, input);
    if (!ds) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(ds);
    return;
  } catch (err) {
    next(err);
  }
};

export const deleteDataSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string);
    const ok = await dataSourceService.remove(req.params.id, tenantId);
    if (!ok) { res.status(404).json({ error: 'Not found' }); return; }
    res.status(204).send();
    return;
  } catch (err) {
    next(err);
  }
};

export const testDataSource = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const type = req.body.type || 'postgresql'; // Default to postgresql for backward compatibility
    const { ok, error } = await dataSourceService.testConnection(type, req.body.connectionConfig || {});
    if (!ok) { res.status(400).json({ ok, error }); return; }
    res.json({ ok: true });
    return;
  } catch (err) {
    next(err);
  }
};

export const discoverSchema = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string);
    const ds = await dataSourceService.getById(req.params.id, tenantId);
    if (!ds) { res.status(404).json({ error: 'Not found' }); return; }
    const schema = await dataSourceService.discoverSchema(ds);
    res.json({ count: schema.length });
    return;
  } catch (err) {
    next(err);
  }
};

