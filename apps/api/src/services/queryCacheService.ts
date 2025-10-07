import crypto from 'crypto';
import { withRedis } from '../utils/redis.js';

interface CacheEntry { value: any; size: number; at: number; expiresAt: number }

class InMemoryTTL {
  private store = new Map<string, CacheEntry>();
  private hits = 0;
  private misses = 0;

  constructor(private maxItems = 1000) {}

  get(key: string): any | undefined {
    const now = Date.now();
    const ent = this.store.get(key);
    if (!ent) { this.misses++; return undefined; }
    if (ent.expiresAt <= now) { this.store.delete(key); this.misses++; return undefined; }
    this.hits++;
    return ent.value;
  }

  set(key: string, value: any, ttlMs: number) {
    const size = JSON.stringify(value)?.length || 0;
    const now = Date.now();
    const ent: CacheEntry = { value, size, at: now, expiresAt: now + ttlMs };
    this.store.set(key, ent);
    if (this.store.size > this.maxItems) {
      // simple eviction: remove oldest
      const oldest = [...this.store.entries()].sort((a,b)=>a[1].at-b[1].at)[0]?.[0];
      if (oldest) this.store.delete(oldest);
    }
  }

  stats() { return { hitRate: this.hits + this.misses === 0 ? 0 : this.hits / (this.hits + this.misses), items: this.store.size, size: [...this.store.values()].reduce((s,e)=>s+e.size,0) }; }
}

class QueryCacheService {
  private mem = new InMemoryTTL(1000);
  private prefix = 'qcache:';

  buildKey(sql: string, params: unknown[] | undefined, tenantId?: string, userId?: string, engine: 'oltp' | 'olap' = 'oltp'): string {
    const p = JSON.stringify(params ?? []);
    const base = `${engine}|${tenantId || 'no-tenant'}|${userId || 'anon'}|${sql}|${p}`;
    return this.prefix + crypto.createHash('sha1').update(base).digest('hex');
  }

  async get(key: string): Promise<any|undefined> {
    return withRedis(async (r) => {
      const v = await r.get(key);
      if (!v) return undefined;
      await r.incr(key + ':hits').catch(()=>{});
      return JSON.parse(v);
    }, async () => this.mem.get(key));
  }

  async set(key: string, value: any, ttlMs: number): Promise<void> {
    const json = JSON.stringify(value);
    return withRedis(async (r) => {
      const p = r.multi();
      p.set(key, json, 'PX', ttlMs);
      p.setnx(key + ':hits', '0');
      p.setnx(key + ':misses', '0');
      await p.exec();
    }, async () => { this.mem.set(key, value, ttlMs); });
  }

  async stats(): Promise<{ hitRate: number; items: number; size: number }>{
    return withRedis(async (r) => {
      const keys = await r.keys(this.prefix + '*:hits');
      let hits = 0; let misses = 0;
      for (const k of keys) {
        const h = parseInt(await r.get(k) || '0', 10);
        const m = parseInt(await r.get(k.replace(/:hits$/, ':misses')) || '0', 10);
        hits += h; misses += m;
      }
      const hitRate = hits + misses === 0 ? 0 : hits / (hits + misses);
      return { hitRate, items: 0, size: 0 };
    }, async () => this.mem.stats());
  }
}

export const queryCacheService = new QueryCacheService();

