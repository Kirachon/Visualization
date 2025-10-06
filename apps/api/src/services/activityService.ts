import { query } from '../database/connection.js';

export interface Activity {
  id: string;
  workspaceId?: string;
  dashboardId?: string;
  type: string;
  actorId?: string;
  details: any;
  at: Date;
}

export interface CreateActivityInput {
  workspaceId?: string;
  dashboardId?: string;
  type: string;
  actorId?: string;
  details?: any;
}

export class ActivityService {
  async create(input: CreateActivityInput): Promise<Activity> {
    const res = await query(
      `INSERT INTO activities (workspace_id, dashboard_id, type, actor_id, details, at)
       VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *`,
      [input.workspaceId || null, input.dashboardId || null, input.type, input.actorId || null, JSON.stringify(input.details || {})]
    );
    return this.hydrate(res.rows[0]);
  }

  async list(filters: { workspaceId?: string; dashboardId?: string; limit?: number }): Promise<Activity[]> {
    let sql = `SELECT * FROM activities WHERE 1=1`;
    const params: any[] = [];
    if (filters.workspaceId) { params.push(filters.workspaceId); sql += ` AND workspace_id = $${params.length}`; }
    if (filters.dashboardId) { params.push(filters.dashboardId); sql += ` AND dashboard_id = $${params.length}`; }
    sql += ` ORDER BY at DESC LIMIT ${filters.limit || 50}`;
    const res = await query(sql, params);
    return res.rows.map((r) => this.hydrate(r));
  }

  hydrate(row: any): Activity {
    return {
      id: row.id,
      workspaceId: row.workspace_id,
      dashboardId: row.dashboard_id,
      type: row.type,
      actorId: row.actor_id,
      details: row.details,
      at: row.at,
    };
  }
}

export const activityService = new ActivityService();

