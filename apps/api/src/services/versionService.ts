import { query } from '../database/connection.js';

export interface DashboardVersion {
  id: string;
  dashboardId: string;
  version: number;
  diff: any;
  label?: string;
  authorId?: string;
  createdAt: Date;
}

export interface CreateVersionInput {
  dashboardId: string;
  diff: any;
  label?: string;
  authorId?: string;
}

export class VersionService {
  async create(input: CreateVersionInput): Promise<DashboardVersion> {
    const versionRes = await query(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM dashboard_versions WHERE dashboard_id = $1`,
      [input.dashboardId]
    );
    const nextVersion = versionRes.rows[0].next_version;
    const res = await query(
      `INSERT INTO dashboard_versions (dashboard_id, version, diff, label, author_id, created_at)
       VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *`,
      [input.dashboardId, nextVersion, JSON.stringify(input.diff), input.label || null, input.authorId || null]
    );
    return this.hydrate(res.rows[0]);
  }

  async list(dashboardId: string): Promise<DashboardVersion[]> {
    const res = await query(
      `SELECT * FROM dashboard_versions WHERE dashboard_id = $1 ORDER BY version DESC`,
      [dashboardId]
    );
    return res.rows.map((r) => this.hydrate(r));
  }

  async getById(id: string): Promise<DashboardVersion | null> {
    const res = await query(`SELECT * FROM dashboard_versions WHERE id = $1`, [id]);
    if (res.rows.length === 0) return null;
    return this.hydrate(res.rows[0]);
  }

  hydrate(row: any): DashboardVersion {
    return {
      id: row.id,
      dashboardId: row.dashboard_id,
      version: row.version,
      diff: row.diff,
      label: row.label,
      authorId: row.author_id,
      createdAt: row.created_at,
    };
  }
}

export const versionService = new VersionService();

