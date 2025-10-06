import { query } from '../database/connection.js';
import crypto from 'crypto';
import type { DashboardShare, PublicDashboardLink, CreateShareRequest, CreatePublicLinkRequest } from '../models/DashboardShare.js';

export class DashboardSharingService {
  async shareWithUser(input: CreateShareRequest, createdBy: string): Promise<DashboardShare> {
    const res = await query(
      `INSERT INTO dashboard_shares (dashboard_id, user_id, permission, created_by, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (dashboard_id, user_id) 
       DO UPDATE SET permission = $3, created_at = NOW()
       RETURNING id, dashboard_id, user_id, permission, created_at, created_by`,
      [input.dashboardId, input.userId, input.permission, createdBy]
    );
    return this.hydrateShare(res.rows[0]);
  }

  async listShares(dashboardId: string): Promise<DashboardShare[]> {
    const res = await query(
      `SELECT * FROM dashboard_shares WHERE dashboard_id = $1 ORDER BY created_at DESC`,
      [dashboardId]
    );
    return res.rows.map((r) => this.hydrateShare(r));
  }

  async removeShare(dashboardId: string, userId: string): Promise<boolean> {
    const res = await query(
      `DELETE FROM dashboard_shares WHERE dashboard_id = $1 AND user_id = $2`,
      [dashboardId, userId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async checkUserAccess(dashboardId: string, userId: string): Promise<'owner' | 'edit' | 'view' | null> {
    // Check if user is owner
    const ownerRes = await query(
      `SELECT owner_id FROM dashboards WHERE id = $1`,
      [dashboardId]
    );
    if (ownerRes.rows.length > 0 && ownerRes.rows[0].owner_id === userId) {
      return 'owner';
    }

    // Check if user has share access
    const shareRes = await query(
      `SELECT permission FROM dashboard_shares WHERE dashboard_id = $1 AND user_id = $2`,
      [dashboardId, userId]
    );
    if (shareRes.rows.length > 0) {
      return shareRes.rows[0].permission;
    }

    return null;
  }

  async createPublicLink(input: CreatePublicLinkRequest, createdBy: string): Promise<PublicDashboardLink> {
    const token = crypto.randomBytes(32).toString('hex');
    const res = await query(
      `INSERT INTO public_dashboard_links (dashboard_id, token, expires_at, created_by, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, dashboard_id, token, expires_at, created_at, created_by`,
      [input.dashboardId, token, input.expiresAt || null, createdBy]
    );
    return this.hydratePublicLink(res.rows[0]);
  }

  async listPublicLinks(dashboardId: string): Promise<PublicDashboardLink[]> {
    const res = await query(
      `SELECT * FROM public_dashboard_links WHERE dashboard_id = $1 ORDER BY created_at DESC`,
      [dashboardId]
    );
    return res.rows.map((r) => this.hydratePublicLink(r));
  }

  async getPublicLink(token: string): Promise<PublicDashboardLink | null> {
    const res = await query(
      `SELECT * FROM public_dashboard_links 
       WHERE token = $1 AND (expires_at IS NULL OR expires_at > NOW())`,
      [token]
    );
    if (res.rows.length === 0) return null;
    return this.hydratePublicLink(res.rows[0]);
  }

  async revokePublicLink(linkId: string): Promise<boolean> {
    const res = await query(
      `DELETE FROM public_dashboard_links WHERE id = $1`,
      [linkId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  hydrateShare(row: any): DashboardShare {
    return {
      id: row.id,
      dashboardId: row.dashboard_id,
      userId: row.user_id,
      permission: row.permission,
      createdAt: row.created_at,
      createdBy: row.created_by,
    };
  }

  hydratePublicLink(row: any): PublicDashboardLink {
    return {
      id: row.id,
      dashboardId: row.dashboard_id,
      token: row.token,
      expiresAt: row.expires_at,
      createdAt: row.created_at,
      createdBy: row.created_by,
    };
  }
}

export const dashboardSharingService = new DashboardSharingService();

