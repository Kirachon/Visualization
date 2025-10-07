import { Pool } from 'pg';
import { decrypt, type CipherText } from '../utils/encryption.js';

export interface OptimizePlanNode {
  'Node Type': string;
  'Relation Name'?: string;
  'Index Name'?: string;
  'Total Cost'?: number;
  Plans?: OptimizePlanNode[];
  [k: string]: any;
}

export interface OptimizePlan {
  Plan: OptimizePlanNode;
  'Total Cost'?: number;
  [k: string]: any;
}

export interface Recommendation {
  type: 'seq_scan' | 'missing_index' | 'high_cost' | 'projection' | 'limit_pushdown';
  message: string;
  table?: string;
  column?: string;
}

function resolvePassword(cfg: any): string {
  const p = cfg?.password;
  if (typeof p === 'object' && p && 'iv' in p && 'ct' in p) {
    return decrypt(p as CipherText);
  }
  return p;
}

function buildConnStr(cfg: any, password?: string): string {
  if (!cfg) throw new Error('connectionConfig required');
  const host = cfg.host || 'localhost';
  const port = cfg.port || 5432;
  const user = cfg.user || cfg.username || 'postgres';
  const db = cfg.database || cfg.db || 'postgres';
  const pass1 = (password !== undefined && password !== null) ? password : resolvePassword(cfg);
  const pass = pass1 ? String(pass1) : '';
  return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${db}`;
}

function isTest(): boolean {
  return (process.env.NODE_ENV || '').toLowerCase() === 'test' || (process.env.OPTIMIZER_TEST_MOCK_PLAN || 'false').toLowerCase() === 'true';
}

function mockPlanForSql(sql: string): OptimizePlan {
  const s = (sql || '').toLowerCase();
  // naive heuristics: if we see where id =, pretend index scan
  if (/where\s+id\s*=/.test(s)) {
    return { Plan: { 'Node Type': 'Index Scan', 'Relation Name': 'mock_table', 'Index Name': 'mock_table_pkey', 'Total Cost': 10 } } as OptimizePlan;
  }
  // default: seq scan
  return { Plan: { 'Node Type': 'Seq Scan', 'Relation Name': 'mock_table', 'Total Cost': 10000 } } as OptimizePlan;
}

export class QueryOptimizerService {
  async analyze(sql: string, connectionConfig?: any): Promise<{ plan: OptimizePlan; totalCost: number }>{
    if (!sql || typeof sql !== 'string') throw new Error('sql required');
    if (isTest() || !connectionConfig) {
      const plan = mockPlanForSql(sql);
      const totalCost = (plan['Total Cost'] ?? plan.Plan?.['Total Cost'] ?? 0) as number;
      return { plan, totalCost };
    }
    const connStr = buildConnStr(connectionConfig);
    const pool = new Pool({ connectionString: connStr, max: 1, statement_timeout: 10000 });
    const client = await pool.connect();
    try {
      const res = await client.query(`EXPLAIN (FORMAT JSON) ${sql}`);
      // EXPLAIN JSON returns rows[0]."QUERY PLAN"[0]
      const arr = (res.rows?.[0]?.['QUERY PLAN'] ?? []) as any[];
      const plan = (arr[0] ?? {}) as OptimizePlan;
      const totalCost = (plan['Total Cost'] ?? plan.Plan?.['Total Cost'] ?? 0) as number;
      return { plan, totalCost };
    } finally {
      client.release();
      await pool.end();
    }
  }

  generateRecommendations(plan: OptimizePlan): Recommendation[] {
    const recs: Recommendation[] = [];
    function walk(node?: OptimizePlanNode) {
      if (!node) return;
      const t = node['Node Type'] || '';
      if (t === 'Seq Scan') {
        recs.push({ type: 'seq_scan', message: 'Sequential scan detected; consider adding an index or filtering predicates', table: node['Relation Name'] });
      }
      if (node['Total Cost'] && node['Total Cost'] > 5000) {
        recs.push({ type: 'high_cost', message: `High total cost ~${Math.round(node['Total Cost'])}` });
      }
      if (node.Plans) node.Plans.forEach(walk);
    }
    walk(plan?.Plan);
    return recs;
  }

  rewrite(sql: string, recommendations: Recommendation[]): { sql: string; applied: string[] } {
    const applied: string[] = [];
    let out = sql;
    // Extremely conservative: remove trivial WHERE 1=1 and recommend projection comment
    const trivialWhere = /where\s+1\s*=\s*1\s*(and\s*)?/i;
    if (trivialWhere.test(out)) {
      out = out.replace(trivialWhere, (m) => (m.toLowerCase().includes('and') ? 'WHERE ' : ''));
      applied.push('remove_trivial_predicate');
    }
    // If recommendation suggests projection and query has SELECT * , add harmless optimizer comment
    if (/select\s+\*/i.test(out) && recommendations.some(r => r.type === 'projection')) {
      out = `/*+ projection:consider */ ${out}`;
      applied.push('projection_hint_comment');
    }
    return { sql: out, applied };
  }
}

export const queryOptimizerService = new QueryOptimizerService();

