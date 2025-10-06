import { Request, Response, NextFunction } from 'express';
import { query } from '../database/connection.js';

export class IdpConfigController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string);
      const r = await query(`SELECT * FROM idp_configs WHERE tenant_id = $1 ORDER BY created_at DESC`, [tenantId]);
      res.json(r.rows);
    } catch (err) { next(err); }
  }
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId || req.body.tenantId;
      const { type, config } = req.body;
      if (!['saml','oidc','ldap'].includes(type)) { res.status(400).json({ error: 'Invalid type' }); return; }
      const r = await query(
        `INSERT INTO idp_configs (tenant_id, type, config, created_at, updated_at) VALUES ($1,$2,$3,NOW(),NOW()) RETURNING *`,
        [tenantId, type, JSON.stringify(config || {})]
      );
      res.status(201).json(r.rows[0]);
    } catch (err) { next(err); }
  }
  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { type, config } = req.body;
      const r = await query(
        `UPDATE idp_configs SET type = COALESCE($1,type), config = COALESCE($2,config), updated_at = NOW() WHERE id = $3 RETURNING *`,
        [type ?? null, config ? JSON.stringify(config) : null, id]
      );
      if (r.rows.length === 0) { res.status(404).json({ error: 'Not found' }); return; }
      res.json(r.rows[0]);
    } catch (err) { next(err); }
  }
  async remove(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const r = await query(`DELETE FROM idp_configs WHERE id = $1`, [id]);
      if ((r.rowCount ?? 0) === 0) { res.status(404).json({ error: 'Not found' }); return; }
      res.status(204).send();
    } catch (err) { next(err); }
  }
}

export const idpConfigController = new IdpConfigController();

