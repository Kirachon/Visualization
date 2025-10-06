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
}

export class CommentService {
  async create(input: CreateCommentInput): Promise<Comment> {
    const mentions = input.mentions || [];
    const res = await query(
      `INSERT INTO comments (dashboard_id, user_id, body, mentions, resolved, created_at, updated_at)
       VALUES ($1,$2,$3,$4,false,NOW(),NOW()) RETURNING *`,
      [input.dashboardId, input.userId, input.body, JSON.stringify(mentions)]
    );
    return this.hydrate(res.rows[0]);
  }

  async list(dashboardId: string): Promise<Comment[]> {
    const res = await query(`SELECT * FROM comments WHERE dashboard_id = $1 ORDER BY created_at ASC`, [dashboardId]);
    return res.rows.map((r) => this.hydrate(r));
  }

  async resolve(id: string): Promise<boolean> {
    const res = await query(`UPDATE comments SET resolved = true, updated_at = NOW() WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
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

