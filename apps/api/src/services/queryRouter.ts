export type Engine = 'oltp' | 'olap';

function hasHint(sql: string, hint: string): boolean {
  return sql.toLowerCase().includes(hint.toLowerCase());
}

function looksAnalytical(sql: string): boolean {
  const s = sql.trim().toLowerCase();
  return s.includes(' group by ') || s.includes(' window ') || s.includes(' over ') || s.includes(' rollup ') || s.includes(' cube ');
}

export function chooseEngine(sql: string, preferOlap?: boolean): Engine {
  if (preferOlap) return 'olap';
  if (hasHint(sql, '/*+ engine=olap */')) return 'olap';
  if (looksAnalytical(sql)) return 'olap';
  return 'oltp';
}

