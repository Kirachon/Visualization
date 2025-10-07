import { mvCatalogService } from './mvCatalogService.js';
import { perfService } from './perfService.js';

export async function refreshOnce(tenantId: string, id: string): Promise<'success'|'failed'> {
  try {
    const rec = await mvCatalogService.get(tenantId, id);
    if (!rec) throw new Error('not_found');
    let status: 'success'|'failed' = 'success';
    if (rec.engine === 'olap') {
      const crossEngine = (process.env.MV_CROSS_ENGINE_ENABLE || 'false').toLowerCase() === 'true';
      if (!crossEngine) return 'failed';
      try {
        // Integrate with ClickHouse service. For tests, this can be mocked.
        const ch = await import('./clickhouseService.js');
        if (typeof (ch as any).refreshMaterializedView === 'function') {
          await (ch as any).refreshMaterializedView(tenantId, rec);
        }
      } catch {
        status = 'failed';
      }
    }
    await mvCatalogService.markRefreshed(tenantId, id, status);
    perfService.mvRefreshByEngine(rec.engine === 'olap' ? 'olap' : 'oltp', status);
    return status;
  } catch {
    await mvCatalogService.markRefreshed(tenantId, id, 'failed');
    perfService.mvRefreshByEngine('oltp', 'failed');
    return 'failed';
  }
}

export function startMvScheduler(): void {
  const enabled = (process.env.MV_AUTO_REFRESH_ENABLE || 'false').toLowerCase() === 'true';
  if (!enabled) return;
  const intervalMs = parseInt(process.env.MV_SCHEDULER_INTERVAL_MS || '60000', 10);
  setInterval(async () => {
    try {
      const tenants = (process.env.SCHEDULER_TENANTS || '').split(',').filter(Boolean);
      const now = Date.now();
      for (const tenantId of tenants) {
        const list = await mvCatalogService.list(tenantId, { enabled: true });
        for (const mv of list) {
          const due = !mv.lastRefreshedAt || (now - mv.lastRefreshedAt) > mv.refreshIntervalMs;
          if (due) await refreshOnce(tenantId, mv.id);
        }
      }
    } catch (e) { /* swallow */ }
  }, intervalMs);
}

