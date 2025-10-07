import apiClient from './api';

export interface SlowQuery { sqlHash: string; durationMs: number; at: number }
export interface CacheStats { hitRate: number; items: number; size: number }
export interface EngineSplit { sinceMs: number; counts: { oltp: number; olap: number }; total: number; pctOlap: number }

export async function fetchSlowQueries(sinceMs: number = 3600000): Promise<SlowQuery[]> {
  const res = await apiClient.get(`/perf/queries/slow`, { params: { since: sinceMs } });
  return res.data as SlowQuery[];
}

export async function fetchCacheStats(): Promise<CacheStats> {
  const res = await apiClient.get(`/perf/cache/stats`);
  return res.data as CacheStats;
}

export async function fetchEngineSplit(sinceMs: number = 3600000): Promise<EngineSplit> {
  const res = await apiClient.get(`/perf/engine/split`, { params: { since: sinceMs } });
  return res.data as EngineSplit;
}

