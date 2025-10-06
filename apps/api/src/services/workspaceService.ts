import { query } from '../database/connection.js';

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  settings: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWorkspaceInput {
  name: string;
  ownerId: string;
  settings?: any;
}

export class WorkspaceService {
  async create(input: CreateWorkspaceInput): Promise<Workspace> {
    const res = await query(
      `INSERT INTO workspaces (name, owner_id, settings, created_at, updated_at)
       VALUES ($1,$2,$3,NOW(),NOW()) RETURNING *`,
      [input.name, input.ownerId, JSON.stringify(input.settings || {})]
    );
    return this.hydrate(res.rows[0]);
  }

  async list(ownerId?: string): Promise<Workspace[]> {
    const sql = ownerId
      ? `SELECT * FROM workspaces WHERE owner_id = $1 ORDER BY created_at DESC`
      : `SELECT * FROM workspaces ORDER BY created_at DESC`;
    const params = ownerId ? [ownerId] : [];
    const res = await query(sql, params);
    return res.rows.map((r) => this.hydrate(r));
  }

  async getById(id: string): Promise<Workspace | null> {
    const res = await query(`SELECT * FROM workspaces WHERE id = $1`, [id]);
    if (res.rows.length === 0) return null;
    return this.hydrate(res.rows[0]);
  }

  async update(id: string, updates: { name?: string; settings?: any }): Promise<Workspace | null> {
    const fields: string[] = [];
    const params: any[] = [];
    if (updates.name) { params.push(updates.name); fields.push(`name = $${params.length}`); }
    if (updates.settings) { params.push(JSON.stringify(updates.settings)); fields.push(`settings = $${params.length}`); }
    if (fields.length === 0) return this.getById(id);
    params.push(id);
    const sql = `UPDATE workspaces SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`;
    const res = await query(sql, params);
    if (res.rows.length === 0) return null;
    return this.hydrate(res.rows[0]);
  }

  async remove(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM workspaces WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  hydrate(row: any): Workspace {
    return {
      id: row.id,
      name: row.name,
      ownerId: row.owner_id,
      settings: row.settings,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const workspaceService = new WorkspaceService();

