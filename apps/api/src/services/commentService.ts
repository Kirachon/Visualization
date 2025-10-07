import { query } from '../database/connection.js';

const isTestEnv = (process.env.NODE_ENV || '').toLowerCase() === 'test';
const inMemoryComments: any[] = isTestEnv ? [] : [];

export interface Comment {
  id: string;
  dashboardId: string;
  userId: string;
  body: string;
  mentions: string[];
  resolved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCommentInput {
  dashboardId: string;
  userId: string;
  body: string;
  mentions?: string[];
  parentId?: string | null;
  tenantId?: string; // optional for notifications/logging
}

export class CommentService {
  async create(input: CreateCommentInput): Promise<Comment> {
    const mentions = input.mentions || [];
    // Sanitize body using sanitize-html with a safe allowlist
    const sanitizeHtml = (await import('sanitize-html')).default;
    const safeBody = sanitizeHtml(String(input.body), { allowedTags: ['b','i','em','strong','a','code','pre','p','ul','ol','li','br'], allowedAttributes: { a: ['href','title','target'] } });

    if (isTestEnv) {
      const now = new Date();
      const row = {
        id: `c_${inMemoryComments.length + 1}`,
        dashboard_id: input.dashboardId,
        user_id: input.userId,
        body: safeBody,
        mentions,
        resolved: false,
        created_at: now,
        updated_at: now,
      };
      inMemoryComments.push(row);
      const created = this.hydrate(row);
      // In test env, skip heavy side effects by default. Allow opt-in for mention notifications via env.
      try {
        const enableMentionsInTest = (process.env.TEST_ENABLE_MENTION_NOTIFS || 'false').toLowerCase() === 'true';
        const enabled = (process.env.COMMENTS_MENTIONS_NOTIFY || 'false').toLowerCase() === 'true';
        if (enableMentionsInTest && enabled && mentions.length) {
          const { notificationService } = await import('./notificationService.js');
          await notificationService.notifyMentions(input.tenantId || 'unknown-tenant', created.dashboardId, created.userId, mentions, created.body);
        }
      } catch {}
      return created;
    }

    const res = await query(
      `INSERT INTO comments (dashboard_id, user_id, body, mentions, parent_id, resolved, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,false,NOW(),NOW()) RETURNING *`,
      [input.dashboardId, input.userId, safeBody, JSON.stringify(mentions), input.parentId || null]
    );
    const created = this.hydrate(res.rows[0]);

    // Activity log and realtime broadcast
    try {
      const { activityService } = await import('./activityService.js');
      await activityService.create({ dashboardId: created.dashboardId, type: 'comment.added', actorId: created.userId, details: { commentId: created.id } });
    } catch {}
    try {
      const { realtimeDataService } = await import('./realtimeDataService.js');
      const tenantTopicPart = (input.tenantId && input.tenantId !== 'unknown-tenant') ? `tenant:${input.tenantId}:` : '';
      const topic = tenantTopicPart ? `collab:comments:${tenantTopicPart}dashboard:${created.dashboardId}` : `collab:comments:dashboard:${created.dashboardId}`;
      await realtimeDataService.publish(topic, { type: 'comment.added', comment: created });
    } catch {}

    // Mentions notifications
    try {
      const enabled = (process.env.COMMENTS_MENTIONS_NOTIFY || 'false').toLowerCase() === 'true';
      if (enabled && mentions.length) {
        const { notificationService } = await import('./notificationService.js');
        await notificationService.notifyMentions(input.tenantId || 'unknown-tenant', created.dashboardId, created.userId, mentions, created.body);
      }
    } catch {}

    return created;
  }

  async list(dashboardId: string): Promise<Comment[]> {
    if (isTestEnv) {
      return inMemoryComments
        .filter((r) => r.dashboard_id === dashboardId)
        .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
        .map((r) => this.hydrate(r));
    }
    const res = await query(`SELECT * FROM comments WHERE dashboard_id = $1 ORDER BY created_at ASC`, [dashboardId]);
    return res.rows.map((r) => this.hydrate(r));
  }

  async resolve(id: string, ctx: { tenantId: string; actorUserId: string }): Promise<boolean> {
    if (isTestEnv) {
      const found = inMemoryComments.find((r) => r.id === id);
      if (!found) return false;
      found.resolved = true;
      found.updated_at = new Date();
      return true;
    }
    const res = await query(`UPDATE comments SET resolved = true, updated_at = NOW() WHERE id = $1 RETURNING dashboard_id`, [id]);
    const ok = (res.rowCount ?? 0) > 0;
    if (ok) {
      const dashboardId = res.rows[0].dashboard_id as string;
      try { const { auditService } = await import('./auditService.js'); await auditService.log({ tenantId: ctx.tenantId, userId: ctx.actorUserId, action: 'comment_resolved', resourceType: 'comment', resourceId: id, details: { dashboardId } }); } catch {}
      try { const { activityService } = await import('./activityService.js'); await activityService.create({ dashboardId, type: 'comment.resolved', actorId: ctx.actorUserId, details: { commentId: id } }); } catch {}
    }
    return ok;
  }

  async unresolve(id: string, ctx: { tenantId: string; actorUserId: string }): Promise<boolean> {
    if (isTestEnv) {
      const found = inMemoryComments.find((r) => r.id === id);
      if (!found) return false;
      found.resolved = false;
      found.updated_at = new Date();
      return true;
    }
    const res = await query(`UPDATE comments SET resolved = false, updated_at = NOW() WHERE id = $1 RETURNING dashboard_id`, [id]);
    const ok = (res.rowCount ?? 0) > 0;
    if (ok) {
      const dashboardId = res.rows[0].dashboard_id as string;
      try { const { auditService } = await import('./auditService.js'); await auditService.log({ tenantId: ctx.tenantId, userId: ctx.actorUserId, action: 'comment_unresolved', resourceType: 'comment', resourceId: id, details: { dashboardId } }); } catch {}
      try { const { activityService } = await import('./activityService.js'); await activityService.create({ dashboardId, type: 'comment.unresolved', actorId: ctx.actorUserId, details: { commentId: id } }); } catch {}
    }
    return ok;
  }

  hydrate(row: any): Comment {
    return {
      id: row.id,
      dashboardId: row.dashboard_id,
      userId: row.user_id,
      body: row.body,
      mentions: row.mentions || [],
      resolved: row.resolved,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const commentService = new CommentService();

