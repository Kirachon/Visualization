import { query } from '../database/connection.js';

export interface GdprRequest {
  id: string;
  subjectId: string;
  type: 'rtbf' | 'export';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export interface CreateGdprRequestInput {
  subjectId: string;
  type: 'rtbf' | 'export';
}

export class GdprService {
  async createRequest(input: CreateGdprRequestInput): Promise<GdprRequest> {
    const res = await query(
      `INSERT INTO gdpr_requests (subject_id, type, status, created_at) VALUES ($1,$2,'pending',NOW()) RETURNING *`,
      [input.subjectId, input.type]
    );
    return this.hydrate(res.rows[0]);
  }

  async listRequests(filters?: { subjectId?: string; status?: string }): Promise<GdprRequest[]> {
    let sql = `SELECT * FROM gdpr_requests WHERE 1=1`;
    const params: any[] = [];
    if (filters?.subjectId) { params.push(filters.subjectId); sql += ` AND subject_id = $${params.length}`; }
    if (filters?.status) { params.push(filters.status); sql += ` AND status = $${params.length}`; }
    sql += ` ORDER BY created_at DESC`;
    const res = await query(sql, params);
    return res.rows.map((r) => this.hydrate(r));
  }

  async executeRTBF(requestId: string): Promise<void> {
    await query(`UPDATE gdpr_requests SET status = 'in_progress' WHERE id = $1`, [requestId]);
    // Stub: in production, scan all tables for subject_id and delete/anonymize
    // For now, just mark completed
    await query(`UPDATE gdpr_requests SET status = 'completed', completed_at = NOW() WHERE id = $1`, [requestId]);
  }

  async executeExport(requestId: string): Promise<any> {
    await query(`UPDATE gdpr_requests SET status = 'in_progress' WHERE id = $1`, [requestId]);
    // Stub: in production, gather all PII for subject and bundle
    const data = { message: 'Export data placeholder' };
    await query(`UPDATE gdpr_requests SET status = 'completed', completed_at = NOW() WHERE id = $1`, [requestId]);
    return data;
  }

  hydrate(row: any): GdprRequest {
    return {
      id: row.id,
      subjectId: row.subject_id,
      type: row.type,
      status: row.status,
      createdAt: row.created_at,
      completedAt: row.completed_at,
    };
  }
}

export const gdprService = new GdprService();

