import { perfService } from './perfService.js';

export async function suggestFromRecentWorkload(_tenantId: string, sinceMs: number = 10 * 60_000) {
  const enabled = (process.env.MV_AUTO_DETECT_ENABLE || 'false').toLowerCase() === 'true';
  if (!enabled) return [] as any[];
  const slow = perfService.slowSince(sinceMs);
  const set = new Set<string>();
  const suggestions: Array<{ definitionSql: string; name: string } > = [];
  for (const rec of slow) {
    // heuristic: if query has GROUP BY or COUNT/SUM keywords, propose as MV
    const key = rec.sqlHash; if (set.has(key)) continue; set.add(key);
    // In real impl we would retrieve original SQL by hash; MVP can't, so skip
  }
  return suggestions;
}

export async function recordSuggested(n = 1) { perfService.mvSuggested(n); }

