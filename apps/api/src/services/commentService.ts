import { query } from '../database/connection.js';

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
}

export class CommentService {
  async create(input: CreateCommentInput): Promise<Comment> {
    const mentions = input.mentions || [];
    // Sanitize body using sanitize-html with a safe allowlist
    const sanitizeHtml = (await import('sanitize-html')).default;
    const safeBody = sanitizeHtml(String(input.body), { allowedTags: ['b','i','em','strong','a','code','pre','p','ul','ol','li','br'], allowedAttributes: { a: ['href','title','target'] } });
    const res = await query(
      `INSERT INTO comments (dashboard_id, user_id, body, mentions, parent_id, resolved, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,false,NOW(),NOW()) RETURNING *`,
      [input.dashboardId, input.userId, safeBody, JSON.stringify(mentions), input.parentId || null]
    );
    const created = this.hydrate(res.rows[0]);
    try {
      const enabled = (process.env.COMMENTS_MENTIONS_NOTIFY || 'false').toLowerCase() === 'true';
      if (enabled && mentions.length) {
        const { notificationService } = await import('./notificationService.js');
        // TODO/ASSUMPTION: tenantId is not readily available in this layer; using placeholder. Controller should pass tenant.
        await notificationService.notifyMentions('unknown-tenant', created.dashboardId, created.userId, mentions, created.body);
      }
    } catch {}
    return created;
  }

  async list(dashboardId: string): Promise<Comment[]> {
    const res = await query(`SELECT * FROM comments WHERE dashboard_id = $1 ORDER BY created_at ASC`, [dashboardId]);
    return res.rows.map((r) => this.hydrate(r));
  }

  async resolve(id: string, ctx: { tenantId: string; actorUserId: string }): Promise<boolean> {
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

