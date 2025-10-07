import crypto from 'crypto';
import { queryCacheService } from './queryCacheService.js';

export interface QueryRecord { sqlHash: string; durationMs: number; at: number }

class PerfService {
  private queries: QueryRecord[] = [];
  private max = 1000;

  // Track engine usage events for simple OLTP vs OLAP split over a recent window
  private engineEvents: Array<{ engine: 'oltp' | 'olap'; at: number }> = [];
  private mvCounters = { suggested: 0, refreshSuccess: 0, refreshFailed: 0, rewriteUsed: 0, rewriteBypassed: 0 };
  private mvCountersByEngine: Record<'oltp'|'olap', { refreshSuccess: number; refreshFailed: number; rewriteUsed: number; rewriteBypassed: number }> = {
    oltp: { refreshSuccess: 0, refreshFailed: 0, rewriteUsed: 0, rewriteBypassed: 0 },
    olap: { refreshSuccess: 0, refreshFailed: 0, rewriteUsed: 0, rewriteBypassed: 0 },
  };
  private engineMax = 2000;

  record(sql: string, durationMs: number, engine?: 'oltp' | 'olap') {
    const sqlHash = crypto.createHash('sha1').update(sql).digest('hex');
    const rec = { sqlHash, durationMs, at: Date.now() };
    this.queries.push(rec);
    if (this.queries.length > this.max) this.queries.shift();

    if (engine) {
      this.engineEvents.push({ engine, at: rec.at });
      if (this.engineEvents.length > this.engineMax) this.engineEvents.shift();
    }
  }

  mvSuggested(n: number = 1) { this.mvCounters.suggested += n; }
  mvRefresh(status: 'success'|'failed') { if (status === 'success') this.mvCounters.refreshSuccess++; else this.mvCounters.refreshFailed++; }
  mvRefreshByEngine(engine: 'oltp'|'olap', status: 'success'|'failed') {
    if (status === 'success') this.mvCountersByEngine[engine].refreshSuccess++; else this.mvCountersByEngine[engine].refreshFailed++;
  }
  mvRewrite(used: boolean) { if (used) this.mvCounters.rewriteUsed++; else this.mvCounters.rewriteBypassed++; }
  mvRewriteByEngine(engine: 'oltp'|'olap', used: boolean) {
    if (used) this.mvCountersByEngine[engine].rewriteUsed++; else this.mvCountersByEngine[engine].rewriteBypassed++;
  }
  mvStats() { return { ...this.mvCounters, byEngine: JSON.parse(JSON.stringify(this.mvCountersByEngine)) }; }

  slowSince(sinceMs: number): QueryRecord[] {
    const cutoff = Date.now() - sinceMs;
    return this.queries.filter((q) => q.at >= cutoff).sort((a, b) => b.durationMs - a.durationMs).slice(0, 100);
  }

  engineSplitSince(sinceMs: number): { sinceMs: number; counts: { oltp: number; olap: number }; total: number; pctOlap: number } {
    const cutoff = Date.now() - sinceMs;
    let oltp = 0; let olap = 0;
    for (const ev of this.engineEvents) {
      if (ev.at >= cutoff) {
        if (ev.engine === 'oltp') oltp++; else olap++;
      }
    }
    const total = oltp + olap;
    const pctOlap = total === 0 ? 0 : olap / total;
    return { sinceMs, counts: { oltp, olap }, total, pctOlap };
  }

  async cacheStats() {
    return queryCacheService.stats();
  }
}

export const perfService = new PerfService();

