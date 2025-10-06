import IORedis from 'ioredis';

let client: IORedis | null = null;

export function getRedis(): IORedis | null {
  if (client) return client;
  const url = process.env.REDIS_URL || process.env.REDIS_CONNECTION_STRING;
  if (!url) return null;
  try {
    client = new IORedis(url, { lazyConnect: true, maxRetriesPerRequest: 1 });
    // Do not auto-connect; callers can await .connect() when needed
    return client;
  } catch {
    return null;
  }
}

export async function withRedis<T>(fn: (r: IORedis) => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  const r = getRedis();
  if (!r) return fallback();
  try {
    if ((r as any).status !== 'ready') await r.connect();
    return await fn(r);
  } catch {
    return fallback();
  }
}

