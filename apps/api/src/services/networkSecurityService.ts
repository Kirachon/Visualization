import { query } from '../database/connection.js';

export interface IdsEvent {
  id: string;
  type: string;
  srcIp: string;
  metadata: any;
  at: Date;
  action?: string;
}

export interface RecordEventInput {
  type: string;
  srcIp: string;
  metadata?: any;
  action?: string;
}

export class NetworkSecurityService {
  async recordEvent(input: RecordEventInput): Promise<IdsEvent> {
    const res = await query(
      `INSERT INTO ids_events (type, src_ip, metadata, at, action)
       VALUES ($1,$2,$3,NOW(),$4) RETURNING *`,
      [input.type, input.srcIp, JSON.stringify(input.metadata || {}), input.action || null]
    );
    return this.hydrate(res.rows[0]);
  }

  async listEvents(filters?: { srcIp?: string; type?: string; limit?: number }): Promise<IdsEvent[]> {
    let sql = `SELECT * FROM ids_events WHERE 1=1`;
    const params: any[] = [];
    if (filters?.srcIp) { params.push(filters.srcIp); sql += ` AND src_ip = $${params.length}`; }
    if (filters?.type) { params.push(filters.type); sql += ` AND type = $${params.length}`; }
    sql += ` ORDER BY at DESC LIMIT ${filters?.limit || 100}`;
    const res = await query(sql, params);
    return res.rows.map((r) => this.hydrate(r));
  }

  hydrate(row: any): IdsEvent {
    return {
      id: row.id,
      type: row.type,
      srcIp: row.src_ip,
      metadata: row.metadata,
      at: row.at,
      action: row.action,
    };
  }
}

export const networkSecurityService = new NetworkSecurityService();

