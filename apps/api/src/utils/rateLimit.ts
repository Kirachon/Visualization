import { RateLimiterRedis, RateLimiterMemory } from 'rate-limiter-flexible';
import { getRedis } from './redis.js';

const limiters = new Map<string, RateLimiterRedis | RateLimiterMemory>();

export function getLimiter(keyspace: string, points = 60, duration = 60) {
  if (limiters.has(keyspace)) return limiters.get(keyspace)!;
  const r = getRedis();
  if (r) {
    const rl = new RateLimiterRedis({ storeClient: r as any, keyPrefix: keyspace, points, duration });
    limiters.set(keyspace, rl);
    return rl;
  }
  const rl = new RateLimiterMemory({ keyPrefix: keyspace, points, duration });
  limiters.set(keyspace, rl);
  return rl;
}

export async function assertRateLimit(keyspace: string, key: string, points = 1) {
  const limiter = getLimiter(keyspace);
  try { await (limiter as any).consume(key, points); }
  catch { throw new Error('Rate limit exceeded'); }
}

