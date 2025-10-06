import { query } from '../database/connection.js';

export type ShareLevel = 'view'|'comment'|'edit'|'admin';

export class ShareService {
  async getLevelForUser(dashboardId: string, userId: string, roles: string[] = []): Promise<ShareLevel|null> {
    const now = new Date().toISOString();
    const res = await query(
      `SELECT level FROM dashboard_shares WHERE dashboard_id=$1 AND start_at<= $3 AND (end_at IS NULL OR end_at> $3)
       AND ((subject_type='user' AND subject_id=$2) OR (subject_type='role' AND subject_id::text = ANY($4)))
       ORDER BY CASE level WHEN 'admin' THEN 4 WHEN 'edit' THEN 3 WHEN 'comment' THEN 2 WHEN 'view' THEN 1 ELSE 0 END DESC LIMIT 1`,
      [dashboardId, userId, now, roles.map(String)]
    );
    if (res.rows.length === 0) return null;
    return res.rows[0].level as ShareLevel;
  }

  hasAtLeast(level: ShareLevel, required: ShareLevel): boolean {
    const order: ShareLevel[] = ['view','comment','edit','admin'];
    return order.indexOf(level) >= order.indexOf(required);
  }
}

export const shareService = new ShareService();

