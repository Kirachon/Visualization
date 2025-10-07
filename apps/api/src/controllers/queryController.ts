import { Request, Response, NextFunction } from 'express';
import { queryService } from '../services/queryService.js';
import { clickhouseService } from '../services/clickhouseService.js';
import { chooseEngine } from '../services/queryRouter.js';
import { dataSourceService } from '../services/dataSourceService.js';
import { perfService } from '../services/perfService.js';
import { auditService } from '../services/auditService.js';
import { queryCacheService } from '../services/queryCacheService.js';
import { queryOptimizerService } from '../services/queryOptimizerService.js';
import crypto from 'crypto';

export const executeQuery = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { connectionConfig, sql, params, limit, offset, timeoutMs, useOlap } = req.body;

    let cfg = connectionConfig;
    if (!cfg) {
      const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string);
      cfg = await dataSourceService.resolveConnectionConfigById(req.params.id, tenantId);
      if (!cfg) { res.status(404).json({ error: 'Data source not found' }); return; }
    }

    const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string);
    const userId = (req as any).user?.userId || 'anon';
    const userClaims = {
      tenantId,
      department: (req as any).user?.department || null,
      region: (req as any).user?.region || null,
    } as any;

    const preferOlap = useOlap === true || (typeof useOlap === 'string' && useOlap.toLowerCase() === 'true');

    // Decide engine (heuristics + hint + optional body flag)
    const engineWanted = chooseEngine(sql, preferOlap);
    const chEnabled = (process.env.CLICKHOUSE_ENABLE || 'false').toLowerCase() === 'true';
    let engineUsed: 'oltp'|'olap' = engineWanted === 'olap' && chEnabled ? 'olap' : 'oltp';

    // MV rewrite (feature-flagged, before optimizer and cache)
    let effectiveSql = sql;
    let optimizerMeta: any = undefined;
    let mvMeta: any = undefined;
    const optimizerEnabled = (process.env.OPTIMIZER_ENABLE || 'false').toLowerCase() === 'true';
    const rewriteEnabled = (process.env.OPTIMIZER_REWRITE_ENABLE || 'false').toLowerCase() === 'true';
    // Try MV rewrite first
    try {
      const mvEnabled = (process.env.MV_ENABLE || 'false').toLowerCase() === 'true';
      const mvRewrite = (process.env.MV_REWRITE_ENABLE || 'false').toLowerCase() === 'true';
      if (mvEnabled && mvRewrite) {
        const { tryRewriteWithMV } = await import('../services/mvRewriteService.js');
        const mvRes = await tryRewriteWithMV(tenantId, effectiveSql);
        if (mvRes.used) {
          effectiveSql = mvRes.sql;
          mvMeta = { used: true, mvId: mvRes.mvId, freshnessMs: mvRes.freshnessMs, engine: mvRes.engine };
          if (mvRes.engine === 'olap' && chEnabled) engineUsed = 'olap';
        } else {
          mvMeta = { used: false, reason: mvRes.reason };
        }
      }
    } catch { mvMeta = { used: false, reason: 'mv_error' }; }

    if (optimizerEnabled) {
      try {
        const { plan, totalCost } = await queryOptimizerService.analyze(effectiveSql, cfg);
        const recommendations = queryOptimizerService.generateRecommendations(plan);
        let rewritten = { sql: effectiveSql, applied: [] as string[] };
        if (rewriteEnabled) {
          rewritten = queryOptimizerService.rewrite(effectiveSql, recommendations);
          effectiveSql = rewritten.sql;
        }
        optimizerMeta = {
          analyzed: true,
          totalCost,
          recommendations,
          rewritten: rewriteEnabled && rewritten.applied.length > 0,
          rewriteApplied: rewritten.applied,
        };
      } catch {
        optimizerMeta = { analyzed: false };
      }
    }

    // Cache lookup (tenant+user isolated; include engine actually used)
    const cacheTtlMs = parseInt(process.env.QUERY_CACHE_TTL_MS || '60000', 10); // 60s default
    const cacheKey = queryCacheService.buildKey(effectiveSql, params, tenantId, userId, engineUsed);
    const cached = cacheTtlMs > 0 ? await queryCacheService.get(cacheKey) : undefined;
    if (cached) {
      const sqlHash = crypto.createHash('sha1').update(effectiveSql).digest('hex');
      perfService.record(effectiveSql, 1, engineUsed);
      return void res.json({ rows: cached.rows, rowCount: cached.rowCount, executionTime: 1, metadata: { engine: engineUsed, cacheHit: true, sqlHash, optimizer: optimizerMeta, mv: mvMeta } });
    }

    try {
      const sqlHash = crypto.createHash('sha1').update(effectiveSql).digest('hex');
      const result = engineUsed === 'olap'
        ? await clickhouseService.execute({ sql: effectiveSql, params, timeoutMs, tenantId })
        : await queryService.execute({ connectionConfig: cfg, sql: effectiveSql, params, limit, offset, timeoutMs, tenantId, userClaims });

      const executionTime = (result as any).durationMs ?? 0;
      perfService.record(effectiveSql, executionTime, engineUsed);

      if (cacheTtlMs > 0 && result.rows && Number.isFinite(result.rowCount)) {
        await queryCacheService.set(cacheKey, { rows: result.rows, rowCount: result.rowCount }, cacheTtlMs).catch(()=>{});
      }

      try {
        await auditService.log({
          tenantId,
          userId: (req as any).user?.userId || null,
          action: 'query.execute',
          resourceType: 'data',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'] as string | undefined,
          details: { sqlHash, rowCount: result.rowCount, durationMs: executionTime, engine: engineUsed },
        });
      } catch { /* swallow audit errors */ }

      return void res.json({ rows: result.rows, rowCount: result.rowCount, executionTime, metadata: { engine: engineUsed, cacheHit: false, sqlHash, optimizer: optimizerMeta, mv: mvMeta } });
    } catch (e: any) {
      const msg = String(e?.message || '').toLowerCase();
      if (msg.includes('statement timeout') || msg.includes('canceling statement due to statement timeout')) {
        return void res.status(504).json({ error: 'Query timeout exceeded', guidance: 'Try reducing scope or increasing timeout.' });
      }
      throw e;
    }
  } catch (err) {
    next(err);
    return;
  }
};

