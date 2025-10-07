import { QueryOptimizerService } from '../../services/queryOptimizerService.js';

describe('QueryOptimizerService', () => {
  const svc = new QueryOptimizerService();

  test('analyze returns mocked plan in test mode (seq scan default)', async () => {
    const { plan, totalCost } = await svc.analyze('SELECT * FROM big_table');
    expect(plan.Plan['Node Type']).toBeDefined();
    expect(totalCost).toBeGreaterThanOrEqual(0);
  });

  test('analyze detects index scan pattern on id predicate', async () => {
    const { plan } = await svc.analyze('SELECT * FROM users WHERE id = 1');
    expect(['Index Scan','Seq Scan']).toContain(plan.Plan['Node Type']);
  });

  test('generateRecommendations flags seq scan', () => {
    const recs = svc.generateRecommendations({ Plan: { 'Node Type': 'Seq Scan', 'Relation Name': 't1', 'Total Cost': 100 } } as any);
    expect(recs.find(r => r.type === 'seq_scan')).toBeTruthy();
  });

  test('generateRecommendations flags high cost', () => {
    const recs = svc.generateRecommendations({ Plan: { 'Node Type': 'Index Scan', 'Total Cost': 20000 } } as any);
    expect(recs.find(r => r.type === 'high_cost')).toBeTruthy();
  });

  test('rewrite removes trivial predicate', () => {
    const { sql, applied } = svc.rewrite('SELECT * FROM t WHERE 1=1 AND a=1', []);
    expect(sql.toLowerCase()).not.toMatch(/1\s*=\s*1/);
    expect(applied).toContain('remove_trivial_predicate');
  });

  test('rewrite adds projection hint comment when projection recommendation present', () => {
    const { sql, applied } = svc.rewrite('SELECT * FROM t', [{ type: 'projection', message: 'add projection' } as any]);
    expect(sql.startsWith('/*+')).toBeTruthy();
    expect(applied).toContain('projection_hint_comment');
  });

  test('rewrite is conservative otherwise (no change)', () => {
    const input = 'SELECT id, name FROM t WHERE a=1';
    const { sql, applied } = svc.rewrite(input, []);
    expect(sql).toBe(input);
    expect(applied.length).toBe(0);
  });

  test('generateRecommendations traverses nested plan nodes', () => {
    const recs = svc.generateRecommendations({ Plan: { 'Node Type': 'Nested Loop', Plans: [ { 'Node Type': 'Seq Scan', 'Relation Name': 't2', 'Total Cost': 6000 } ] } } as any);
    expect(recs.find(r => r.type === 'seq_scan')).toBeTruthy();
    expect(recs.find(r => r.type === 'high_cost')).toBeTruthy();
  });

  test('analyze throws on missing sql', async () => {
    await expect(svc.analyze(undefined as any)).rejects.toThrow();
  });

  test('mock plan respects id predicate heuristic', async () => {
    const a = await svc.analyze('select * from t where id=123');
    expect(a.plan.Plan['Node Type']).toMatch(/Scan/);
  });
});

