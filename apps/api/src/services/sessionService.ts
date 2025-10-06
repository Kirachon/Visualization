import { query } from '../database/connection.js';
import type { UserSession, CreateSessionRequest } from '../models/UserSession.js';

export class SessionService {
  async create(input: CreateSessionRequest): Promise<UserSession> {
    const res = await query(
      `INSERT INTO user_sessions (user_id, token, expires_at, ip_address, user_agent, last_activity_at, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, user_id, token, expires_at, last_activity_at, ip_address, user_agent, created_at`,
      [input.userId, input.token, input.expiresAt.toISOString(), input.ipAddress || null, input.userAgent || null]
    );
    const session = this.hydrate(res.rows[0]);

    // Optional concurrency limit
    if ((process.env.SESSIONS_CONCURRENCY_LIMIT || 'false').toLowerCase() === 'true') {
      const max = parseInt(process.env.SESSIONS_CONCURRENCY_LIMIT_N || '5', 10);
      const list = await this.listUserSessions(input.userId);
      if (list.length > max) {
        const toRevoke = list.slice(max).map((s) => s.token);
        if (toRevoke.length) {
          await query(`DELETE FROM user_sessions WHERE user_id = $1 AND token = ANY($2)`, [input.userId, toRevoke]);
        }
      }
    }

    return session;
  }

  async getByToken(token: string): Promise<UserSession | null> {
    const res = await query(
      `SELECT * FROM user_sessions WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );
    if (res.rows.length === 0) return null;
    const sess = this.hydrate(res.rows[0]);

    if ((process.env.SESSIONS_CONCURRENCY_LIMIT || 'false').toLowerCase() === 'true') {
      const idleMin = parseInt(process.env.SESSIONS_IDLE_TIMEOUT_MIN || '30', 10);
      const absHours = parseInt(process.env.SESSIONS_ABSOLUTE_TIMEOUT_HOURS || '24', 10);
      const last = new Date(sess.lastActivityAt || sess.createdAt).getTime();
      const created = new Date(sess.createdAt).getTime();
      const now = Date.now();
      if (now - last > idleMin * 60_000 || now - created > absHours * 3600_000) {
        await this.revoke(token);
        return null;
      }
    }

    return sess;
    if (res.rows.length === 0) return null;
    return this.hydrate(res.rows[0]);
  }

  async listUserSessions(userId: string): Promise<UserSession[]> {
    const res = await query(
      `SELECT * FROM user_sessions WHERE user_id = $1 AND expires_at > NOW() ORDER BY last_activity_at DESC`,
      [userId]
    );
    return res.rows.map((r) => this.hydrate(r));
  }

  async updateActivity(token: string): Promise<boolean> {
    const res = await query(
      `UPDATE user_sessions SET last_activity_at = NOW() WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async revoke(token: string): Promise<boolean> {
    const res = await query(
      `DELETE FROM user_sessions WHERE token = $1`,
      [token]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async revokeAllUserSessions(userId: string): Promise<number> {
    const res = await query(
      `DELETE FROM user_sessions WHERE user_id = $1`,
      [userId]
    );
    return res.rowCount ?? 0;
  }

  async cleanupExpired(): Promise<number> {
    const res = await query(
      `DELETE FROM user_sessions WHERE expires_at <= NOW()`
    );
    return res.rowCount ?? 0;
  }

  hydrate(row: any): UserSession {
    return {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: row.expires_at,
      lastActivityAt: row.last_activity_at,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: row.created_at,
    };
  }
}

export const sessionService = new SessionService();

