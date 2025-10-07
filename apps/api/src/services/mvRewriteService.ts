import { Parser } from 'node-sql-parser';
import { mvCatalogService } from './mvCatalogService.js';

export interface MVRewriteResult {
  sql: string;
  used: boolean;
  mvId?: string;
  freshnessMs?: number;
  reason?: string;
  engine?: 'oltp' | 'olap';
}

const parser = new Parser();

export async function tryRewriteWithMV(tenantId: string, sql: string): Promise<MVRewriteResult> {
  const enabled = (process.env.MV_ENABLE || 'false').toLowerCase() === 'true';
  const rewriteEnabled = (process.env.MV_REWRITE_ENABLE || 'false').toLowerCase() === 'true';
  if (!enabled || !rewriteEnabled) return { sql, used: false, reason: 'mv_disabled' };

  try {
    const signature = mvCatalogService.signature(sql);
    const maxStalenessMs = parseInt(process.env.MV_MAX_STALENESS_MS || '600000', 10);
    const cand = await mvCatalogService.findEligibleBySignature(tenantId, signature, maxStalenessMs);
    if (!cand) return { sql, used: false, reason: 'no_eligible_mv' };

    const crossEngine = (process.env.MV_CROSS_ENGINE_ENABLE || 'false').toLowerCase() === 'true';

    // Minimal rewrite: SELECT * FROM <mv_table> where possible.
    // For MVP we trust signature compatibility; projection/predicate checks are deferred.
    const ast = parser.astify(sql);
    const sel = Array.isArray(ast) ? ast[0] : ast;
    if (sel && sel.type === 'select') {
      // Replace from with the MV table. Use db-qualified name for OLAP when provided
      if (Array.isArray((sel as any).from) && (sel as any).from.length > 0) {
        if (cand.engine === 'olap') {
          if (!crossEngine) return { sql, used: false, reason: 'cross_engine_disabled' };
          (sel as any).from = [{ db: cand.targetDatabase || null, table: cand.targetTable, as: null }];
        } else {
          (sel as any).from = [{ db: null, table: cand.targetTable, as: null }];
        }
      }
      let rewritten = parser.sqlify(sel);
      if (cand.engine === 'olap') {
        // Force OLAP path via hint to query router
        rewritten = `/*+ engine=olap */ ${rewritten}`;
      }
      const freshnessMs = cand.lastRefreshedAt ? (Date.now() - cand.lastRefreshedAt) : undefined;
      return { sql: rewritten, used: true, mvId: cand.id, freshnessMs, engine: (cand.engine as any) };
    }
  } catch {
    return { sql, used: false, reason: 'rewrite_error' };
  }
  return { sql, used: false, reason: 'not_select' };
}

