import { Parser } from 'node-sql-parser';

// LINEAGE_SQL_PARSER: when true, use SQL parser to extract table names for lineage assistance
const parser = new Parser();

export function extractTables(sql: string): string[] {
  if ((process.env.LINEAGE_SQL_PARSER || 'false').toLowerCase() !== 'true') return [];
  try {
    const ast = parser.astify(sql);
    const set = new Set<string>();
    function walk(node: any) {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'table' && node.table) set.add(String(node.table));
      for (const k of Object.keys(node)) walk((node as any)[k]);
    }
    if (Array.isArray(ast)) ast.forEach(walk); else walk(ast);
    return Array.from(set);
  } catch {
    return [];
  }
}

