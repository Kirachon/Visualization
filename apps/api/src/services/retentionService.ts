import { query } from '../database/connection.js';

export interface RetentionPolicy {
  id: string;
  dataType: string;
  ttlDays: number;
  hardDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePolicyInput {
  dataType: string;
  ttlDays: number;
  hardDelete?: boolean;
}

export class RetentionService {
  async createPolicy(input: CreatePolicyInput): Promise<RetentionPolicy> {
    const res = await query(
      `INSERT INTO retention_policies (data_type, ttl_days, hard_delete, created_at, updated_at)
       VALUES ($1,$2,$3,NOW(),NOW()) RETURNING *`,
      [input.dataType, input.ttlDays, input.hardDelete ?? false]
    );
    return this.hydrate(res.rows[0]);
  }

  async listPolicies(): Promise<RetentionPolicy[]> {
    const res = await query(`SELECT * FROM retention_policies ORDER BY data_type ASC`);
    return res.rows.map((r) => this.hydrate(r));
  }

  async removePolicy(id: string): Promise<boolean> {
    const res = await query(`DELETE FROM retention_policies WHERE id = $1`, [id]);
    return (res.rowCount ?? 0) > 0;
  }

  hydrate(row: any): RetentionPolicy {
    return {
      id: row.id,
      dataType: row.data_type,
      ttlDays: row.ttl_days,
      hardDelete: row.hard_delete,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const retentionService = new RetentionService();

