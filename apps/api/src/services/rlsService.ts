import { query } from '../database/connection.js';

// Feature flags (default OFF):
// - RLS_STRICT_MODE: enable predicate validation and safer wrapping
// - RLS_CACHE_TTL_MS: TTL for predicate cache in ms (default 30000)

interface CachedPredicates { predicates: string[]; expiresAt: number }
const rlsCache: Map<string, CachedPredicates> = new Map();

function nowMs() { return Date.now(); }

function validatePredicateStrict(sql: string): void {
  const strict = (process.env.RLS_STRICT_MODE || 'false').toLowerCase() === 'true';
  if (!strict) return;
  // Basic safety checks without SQL parser
  const s = sql.toLowerCase();
  // Disallow statement terminators, union, and comments in predicates
  const forbidden = [';',' union ','/*','*/','--'];
  for (const f of forbidden) {
    if (s.includes(f)) throw new Error('RLS predicate contains forbidden token');
  }
  // Only allow approved tokens
  const allowedTokens = [':tenant_id', ':department', ':region'];
  const tokenPattern = /:[a-z_]+/g;
  const tokens = s.match(tokenPattern) || [];
  for (const t of tokens) {
    if (!allowedTokens.includes(t)) throw new Error(`RLS predicate uses unsupported token: ${t}`);
  }
}


export interface UserClaims {
  tenantId: string;
  department?: string | null;
  region?: string | null;
}

export interface RlsResult {
  sql: string;
  params: any[];
}

// Simple token replacement: :tenant_id, :department, :region -> parameterized values
function parameterizePredicate(predicate: string, baseIndex: number, claims: UserClaims): { text: string; values: any[] } {
  const values: any[] = [];
  let text = predicate;

  const mapping: Record<string, any> = {
    ':tenant_id': claims.tenantId,
    ':department': claims.department ?? null,
    ':region': claims.region ?? null,
  };

  let i = baseIndex;
  for (const token of Object.keys(mapping)) {
    if (text.includes(token)) {
      i += 1;
      values.push(mapping[token]);
      const placeholder = `$${i}`;
      // Replace all occurrences of the token with the placeholder
      text = text.split(token).join(placeholder);
    }
  }

  return { text, values };
}

export class RlsService {
  private async loadPredicates(tenantId: string): Promise<string[]> {
    // TTL cache to avoid frequent DB hits
    const ttl = parseInt(process.env.RLS_CACHE_TTL_MS || '30000', 10);
    const key = tenantId;
    const cached = rlsCache.get(key);
    if (cached && cached.expiresAt > nowMs()) return cached.predicates;

    const res = await query(
      `SELECT predicate_sql FROM rls_policies WHERE tenant_id = $1 AND applies_to = 'data' AND active = true`,
      [tenantId]
    );
    const preds = res.rows.map((r: any) => String(r.predicate_sql));
    for (const p of preds) validatePredicateStrict(p);
    rlsCache.set(key, { predicates: preds, expiresAt: nowMs() + ttl });
    return preds;
  }

  async apply(tenantId: string, user: UserClaims, originalSql: string, originalParams: any[] = []): Promise<RlsResult> {
    const enabled = (process.env.RLS_ENABLED || 'false').toLowerCase() === 'true';
    if (!enabled) return { sql: originalSql, params: originalParams };

    const start = Date.now();
    const predicates = await this.loadPredicates(tenantId);
    if (!predicates.length) return { sql: originalSql, params: originalParams };

    const baseIndex = originalParams.length;
    const paramValues: any[] = [];
    const parts: string[] = [];
    for (const p of predicates) {
      const { text, values } = parameterizePredicate(p, baseIndex + paramValues.length, user);
      parts.push(`(${text})`);
      paramValues.push(...values);
    }

    const rlsWhere = parts.join(' AND ');
    // Safe wrapping for arbitrary SQL using subselect; preserves ORDER/LIMIT inside original
    const wrappedSql = `SELECT * FROM (${originalSql}) AS src WHERE ${rlsWhere}`;
    const dur = Date.now() - start;
    try { const { rlsLatency } = await import('../utils/metrics.js'); rlsLatency.labels(tenantId, 'ok').observe(dur); } catch {}
    return { sql: wrappedSql, params: [...originalParams, ...paramValues] };
  }
}

export const rlsService = new RlsService();

