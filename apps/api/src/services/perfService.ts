import crypto from 'crypto';

export interface QueryRecord { sqlHash: string; durationMs: number; at: number }

class PerfService {
  private queries: QueryRecord[] = [];
  private max = 1000;

  record(sql: string, durationMs: number) {
    const sqlHash = crypto.createHash('sha1').update(sql).digest('hex');
    const rec = { sqlHash, durationMs, at: Date.now() };
    this.queries.push(rec);
    if (this.queries.length > this.max) this.queries.shift();
  }

  slowSince(sinceMs: number): QueryRecord[] {
    const cutoff = Date.now() - sinceMs;
    return this.queries.filter((q) => q.at >= cutoff).sort((a, b) => b.durationMs - a.durationMs).slice(0, 100);
  }

  cacheStats() {
    // Placeholder stats (no cache wired yet)
    return { hitRate: 0, items: 0, size: 0 };
  }
}

export const perfService = new PerfService();

