import { query } from '../database/connection.js';
import type { AuditLog, CreateAuditLogRequest } from '../models/AuditLog.js';
import crypto from 'crypto';

function stableStringify(obj: any): string {
  return JSON.stringify(obj, Object.keys(obj).sort());
}

export class AuditService {
  private isChainEnabled(): boolean {
    return (process.env.AUDIT_CHAIN_ENABLED || 'false').toLowerCase() === 'true';
  }

  private async getLastHash(tenantId: string): Promise<string | null> {
    const res = await query(
      `SELECT hash FROM audit_logs WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [tenantId]
    );
    return res.rows[0]?.hash ?? null;
  }

  async log(input: CreateAuditLogRequest): Promise<AuditLog> {
    let prevHash: string | null = null;
    let hash: string | null = null;

    if (this.isChainEnabled()) {
      prevHash = await this.getLastHash(input.tenantId);
      const canonical = stableStringify({
        tenant_id: input.tenantId,
        user_id: input.userId ?? null,
        action: input.action,
        resource_type: input.resourceType,
        resource_id: input.resourceId ?? null,
        details: input.details ?? null,
        ip_address: input.ipAddress ?? null,
        user_agent: input.userAgent ?? null,
        prev_hash: prevHash,
      });
      hash = crypto.createHash('sha256').update(canonical).digest('hex');
    }

    const res = await query(
      `INSERT INTO audit_logs (tenant_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, prev_hash, hash, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       RETURNING id, tenant_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, prev_hash, hash, created_at`,
      [
        input.tenantId,
        input.userId || null,
        input.action,
        input.resourceType,
        input.resourceId || null,
        input.details ? JSON.stringify(input.details) : null,
        input.ipAddress || null,
        input.userAgent || null,
        prevHash,
        hash,
      ]
    );
    return this.hydrate(res.rows[0]);
  }

  async list(tenantId: string, filters?: {
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): Promise<AuditLog[]> {
    let sql = `SELECT * FROM audit_logs WHERE tenant_id = $1`;
    const params: any[] = [tenantId];
    let paramIndex = 2;

    if (filters?.userId) {
      sql += ` AND user_id = $${paramIndex}`;
      params.push(filters.userId);
      paramIndex++;
    }

    if (filters?.resourceType) {
      sql += ` AND resource_type = $${paramIndex}`;
      params.push(filters.resourceType);
      paramIndex++;
    }

    if (filters?.resourceId) {
      sql += ` AND resource_id = $${paramIndex}`;
      params.push(filters.resourceId);
      paramIndex++;
    }

    if (filters?.startDate) {
      sql += ` AND created_at >= $${paramIndex}`;
      params.push(filters.startDate.toISOString());
      paramIndex++;
    }

    if (filters?.endDate) {
      sql += ` AND created_at <= $${paramIndex}`;
      params.push(filters.endDate.toISOString());
      paramIndex++;
    }

    sql += ` ORDER BY created_at DESC`;

    if (filters?.limit) {
      sql += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
    } else {
      sql += ` LIMIT 100`; // Default limit
    }

    const res = await query(sql, params);
    return res.rows.map((r) => this.hydrate(r));
  }

  async getById(id: string, tenantId: string): Promise<AuditLog | null> {
    const res = await query(
      `SELECT * FROM audit_logs WHERE id = $1 AND tenant_id = $2`,
      [id, tenantId]
    );
    if (res.rows.length === 0) return null;
    return this.hydrate(res.rows[0]);
  }

  hydrate(row: any): AuditLog {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      action: row.action,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      details: row.details,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      prevHash: row.prev_hash,
      hash: row.hash,
      createdAt: row.created_at,
    };
  }

  async verifyChain(tenantId: string, limit = 100): Promise<{ valid: boolean; errors: string[] }> {
    const res = await query(
      `SELECT id, tenant_id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, prev_hash, hash, created_at
       FROM audit_logs WHERE tenant_id = $1 ORDER BY created_at ASC LIMIT $2`,
      [tenantId, limit]
    );
    const errors: string[] = [];
    let prevHash: string | null = null;
    for (const row of res.rows) {
      if (row.prev_hash !== prevHash) {
        errors.push(`Chain break at log ${row.id}: expected prev_hash ${prevHash}, got ${row.prev_hash}`);
      }
      const canonical = stableStringify({
        tenant_id: row.tenant_id,
        user_id: row.user_id,
        action: row.action,
        resource_type: row.resource_type,
        resource_id: row.resource_id,
        details: row.details,
        ip_address: row.ip_address,
        user_agent: row.user_agent,
        prev_hash: row.prev_hash,
      });
      const expectedHash = crypto.createHash('sha256').update(canonical).digest('hex');
      if (row.hash !== expectedHash) {
        errors.push(`Hash mismatch at log ${row.id}: expected ${expectedHash}, got ${row.hash}`);
      }
      prevHash = row.hash;
    }
    return { valid: errors.length === 0, errors };
  }
}

export const auditService = new AuditService();

