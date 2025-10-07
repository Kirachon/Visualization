import crypto from 'crypto';
import { Parser } from 'node-sql-parser';
import { query } from '../database/connection.js';

export interface MVRecord {
  id: string;
  tenantId: string;
  name: string;
  definitionSql: string;
  targetTable: string;
  normalizedSignature: string;
  freshnessTtlMs: number;
  refreshIntervalMs: number;
  lastRefreshedAt: number | null;
  lastRefreshStatus: 'success' | 'failed' | 'never';
  enabled: boolean;
  proposed: boolean;
  usageCount24h: number;
  dependencies?: any;
  engine?: 'oltp' | 'olap';
  targetDatabase?: string | null;
  chOpts?: any;
}

const parser = new Parser();

function validateEngine(input?: 'oltp'|'olap'): 'oltp'|'olap' {
  if (!input) return 'oltp';
  if (input !== 'oltp' && input !== 'olap') throw new Error('invalid engine');
  return input;
}

function normalizeSqlSignature(sql: string): string {
  try {
    const ast = parser.astify(sql);
    // Convert AST back to SQL with consistent formatting, then lowercase
    // Fallback to JSON if sqlify fails for some dialect bits
    try {
      const out = parser.sqlify(ast);
      return crypto.createHash('sha1').update(out.trim().toLowerCase().replace(/\s+/g, ' ')).digest('hex');
    } catch {
      return crypto.createHash('sha1').update(JSON.stringify(ast)).digest('hex');
    }
  } catch {
    return crypto.createHash('sha1').update(sql.trim().toLowerCase().replace(/\s+/g, ' ')).digest('hex');
  }
}

const isTest = () => (process.env.NODE_ENV || '').toLowerCase() === 'test';

class MVCatalogService {
  // simple in-memory store for tests
  private mem = new Map<string, MVRecord>();

  async create(tenantId: string, input: Partial<MVRecord>): Promise<MVRecord> {
    if (!tenantId) throw new Error('tenantId required');
    if (!input?.name || !input.definitionSql) throw new Error('name and definitionSql required');
    const id = crypto.randomUUID();
    const normalizedSignature = normalizeSqlSignature(input.definitionSql);
    const engine = validateEngine(input.engine as any);
    const rec: MVRecord = {
      id,
      tenantId,
      name: input.name!,
      definitionSql: input.definitionSql!,
      targetTable: input.targetTable || `mv_${id.replace(/-/g,'')}`,
      normalizedSignature,
      freshnessTtlMs: input.freshnessTtlMs ?? 10 * 60_000,
      refreshIntervalMs: input.refreshIntervalMs ?? 10 * 60_000,
      lastRefreshedAt: null,
      lastRefreshStatus: 'never',
      enabled: Boolean(input.enabled ?? false),
      proposed: Boolean(input.proposed ?? false),
      usageCount24h: 0,
      dependencies: input.dependencies ?? null,
      engine,
      targetDatabase: input.targetDatabase ?? null,
      chOpts: input.chOpts ?? {},
    };

    if (isTest()) {
      this.mem.set(rec.id, rec);
      return rec;
    }

    await query(
      `INSERT INTO materialized_views (id, tenant_id, name, definition_sql, target_table, normalized_signature, freshness_ttl_ms, refresh_interval_ms, last_refreshed_at, last_refresh_status, enabled, proposed, usage_count_24h, dependencies, engine, target_database, ch_opts, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NULL,$9,$10,$11,$12,$13,$14,$15,$16,NOW(),NOW())`,
      [rec.id, rec.tenantId, rec.name, rec.definitionSql, rec.targetTable, rec.normalizedSignature, rec.freshnessTtlMs, rec.refreshIntervalMs, rec.lastRefreshStatus, rec.enabled, rec.proposed, rec.usageCount24h, rec.dependencies, rec.engine, rec.targetDatabase, rec.chOpts]
    );
    return rec;
  }

  async list(tenantId: string, filters?: { enabled?: boolean; proposed?: boolean }): Promise<MVRecord[]> {
    if (isTest()) {
      let arr = Array.from(this.mem.values()).filter(r => r.tenantId === tenantId);
      if (filters?.enabled !== undefined) arr = arr.filter(r => r.enabled === filters.enabled);
      if (filters?.proposed !== undefined) arr = arr.filter(r => r.proposed === filters.proposed);
      return arr;
    }
    const wh: string[] = ['tenant_id = $1']; const params: any[] = [tenantId];
    if (filters?.enabled !== undefined) { wh.push('enabled = $2'); params.push(filters.enabled); }
    if (filters?.proposed !== undefined) { wh.push('proposed = $3'); params.push(filters.proposed); }
    const res = await query(`SELECT * FROM materialized_views WHERE ${wh.join(' AND ')} ORDER BY created_at DESC`, params);
    return res.rows.map(this.rowToRec);
  }

  async get(tenantId: string, id: string): Promise<MVRecord | null> {
    if (isTest()) {
      const r = this.mem.get(id); return r && r.tenantId === tenantId ? r : null;
    }
    const res = await query(`SELECT * FROM materialized_views WHERE id=$1 AND tenant_id=$2`, [id, tenantId]);
    return res.rows[0] ? this.rowToRec(res.rows[0]) : null;
  }

  async update(tenantId: string, id: string, patch: Partial<MVRecord>): Promise<MVRecord | null> {
    if (isTest()) {
      const cur = await this.get(tenantId, id); if (!cur) return null;
      const next: MVRecord = { ...cur, ...patch };
      if (patch.definitionSql) next.normalizedSignature = normalizeSqlSignature(patch.definitionSql);
      this.mem.set(id, next);
      return next;
    }
    const cur = await this.get(tenantId, id); if (!cur) return null;
    const next: MVRecord = { ...cur, ...patch };
    await query(
      `UPDATE materialized_views SET name=$1, definition_sql=$2, target_table=$3, normalized_signature=$4, freshness_ttl_ms=$5, refresh_interval_ms=$6, last_refreshed_at=$7, last_refresh_status=$8, enabled=$9, proposed=$10, usage_count_24h=$11, dependencies=$12, engine=$13, target_database=$14, ch_opts=$15, updated_at=NOW() WHERE id=$16 AND tenant_id=$17`,
      [next.name, next.definitionSql, next.targetTable, next.normalizedSignature, next.freshnessTtlMs, next.refreshIntervalMs, next.lastRefreshedAt ? new Date(next.lastRefreshedAt) : null, next.lastRefreshStatus, next.enabled, next.proposed, next.usageCount24h, next.dependencies, next.engine ?? 'oltp', next.targetDatabase ?? null, next.chOpts ?? {}, id, tenantId]
    );
    return next;
  }

  async remove(tenantId: string, id: string): Promise<boolean> {
    if (isTest()) { this.mem.delete(id); return true; }
    await query(`DELETE FROM materialized_views WHERE id=$1 AND tenant_id=$2`, [id, tenantId]);
    return true;
  }

  async findEligibleBySignature(tenantId: string, signature: string, maxStalenessMs: number): Promise<MVRecord | null> {
    const now = Date.now();
    const arr = await this.list(tenantId, { enabled: true });
    const cand = arr.find(r => r.normalizedSignature === signature && r.lastRefreshedAt && (now - r.lastRefreshedAt) <= maxStalenessMs);
    return cand || null;
  }

  async markRefreshed(tenantId: string, id: string, status: 'success'|'failed'): Promise<void> {
    const cur = await this.get(tenantId, id); if (!cur) return;
    cur.lastRefreshedAt = Date.now();
    cur.lastRefreshStatus = status;
    await this.update(tenantId, id, cur);
  }

  rowToRec = (row: any): MVRecord => ({
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    definitionSql: row.definition_sql,
    targetTable: row.target_table,
    normalizedSignature: row.normalized_signature,
    freshnessTtlMs: Number(row.freshness_ttl_ms),
    refreshIntervalMs: Number(row.refresh_interval_ms),
    lastRefreshedAt: row.last_refreshed_at ? new Date(row.last_refreshed_at).getTime() : null,
    lastRefreshStatus: row.last_refresh_status || 'never',
    enabled: !!row.enabled,
    proposed: !!row.proposed,
    usageCount24h: Number(row.usage_count_24h || 0),
    dependencies: row.dependencies,
    engine: (row.engine as any) ?? 'oltp',
    targetDatabase: row.target_database ?? null,
    chOpts: row.ch_opts ?? {},
  });

  signature(sql: string): string { return normalizeSqlSignature(sql); }
}

export const mvCatalogService = new MVCatalogService();

