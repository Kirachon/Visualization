/**
 * Presence Service
 * Story 3.3: Collaboration Features
 *
 * Tracks real-time presence of users on dashboards (for avatar presence, cursors).
 */

import { query } from '../database/connection.js';
import { logger } from '../logger/logger.js';

const isTestEnv = (process.env.NODE_ENV || '').toLowerCase() === 'test';
const inMemoryPresence: Presence[] = [];

export interface Presence {
  id: string;
  tenantId: string;
  dashboardId: string;
  userId: string;
  cursorPosition?: any;
  lastSeenAt: Date;
}

export class PresenceService {
  async upsertPresence(params: { tenantId: string; dashboardId: string; userId: string; cursorPosition?: any }): Promise<void> {
    const { tenantId, dashboardId, userId, cursorPosition } = params;
    if (isTestEnv) {
      const existingIdx = inMemoryPresence.findIndex((p) => p.dashboardId === dashboardId && p.userId === userId);
      const entry: Presence = existingIdx >= 0 ? inMemoryPresence[existingIdx] : { id: `${dashboardId}:${userId}`, tenantId, dashboardId, userId, lastSeenAt: new Date() } as Presence;
      entry.cursorPosition = cursorPosition;
      entry.lastSeenAt = new Date();
      if (existingIdx < 0) inMemoryPresence.push(entry);
      return;
    }
    await query(
      `INSERT INTO presence (tenant_id, dashboard_id, user_id, cursor_position, last_seen_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       ON CONFLICT (dashboard_id, user_id) DO UPDATE
       SET cursor_position = EXCLUDED.cursor_position, last_seen_at = CURRENT_TIMESTAMP`,
      [tenantId, dashboardId, userId, cursorPosition ?? null]
    );
  }

  async getActiveUsers(params: { tenantId: string; dashboardId: string; withinSeconds?: number }): Promise<Presence[]> {
    const { tenantId, dashboardId, withinSeconds = 60 } = params;
    if (isTestEnv) {
      const cutoff = Date.now() - withinSeconds * 1000;
      return inMemoryPresence.filter((p) => p.dashboardId === dashboardId && p.tenantId === tenantId && +new Date(p.lastSeenAt) > cutoff);
    }
    const res = await query(
      `SELECT id, tenant_id, dashboard_id, user_id, cursor_position, last_seen_at
       FROM presence
       WHERE tenant_id = $1 AND dashboard_id = $2 AND last_seen_at > NOW() - ($3 || ' seconds')::interval
       ORDER BY last_seen_at DESC`,
      [tenantId, dashboardId, withinSeconds]
    );

    return res.rows.map((r) => ({
      id: r.id,
      tenantId: r.tenant_id,
      dashboardId: r.dashboard_id,
      userId: r.user_id,
      cursorPosition: r.cursor_position,
      lastSeenAt: r.last_seen_at,
    }));
  }

  async clearStalePresences(olderThanSeconds = 3600): Promise<number> {
    if (isTestEnv) {
      const cutoff = Date.now() - olderThanSeconds * 1000;
      const before = inMemoryPresence.length;
      for (let i = inMemoryPresence.length - 1; i >= 0; i--) {
        if (+new Date(inMemoryPresence[i].lastSeenAt) < cutoff) inMemoryPresence.splice(i, 1);
      }
      return before - inMemoryPresence.length;
    }
    const res = await query(`DELETE FROM presence WHERE last_seen_at < NOW() - ($1 || ' seconds')::interval`, [olderThanSeconds]);
    const count = res.rowCount ?? 0;
    if (count > 0) logger.info('Cleared stale presence rows', { count });
    return count;
  }
}

export const presenceService = new PresenceService();

