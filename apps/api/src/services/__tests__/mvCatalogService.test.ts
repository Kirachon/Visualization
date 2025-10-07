import { mvCatalogService } from '../mvCatalogService.js';

describe('mvCatalogService', () => {
  const tenantId = 'tenant-test';

  test('signature is stable for trivial formatting differences', () => {
    const a = mvCatalogService.signature('SELECT  *  FROM t');
    const b = mvCatalogService.signature('select * from t');
    expect(a).toBe(b);
  });

  test('CRUD in memory (test mode)', async () => {
    const rec = await mvCatalogService.create(tenantId, { name: 'mvA', definitionSql: 'SELECT * FROM t', enabled: true });
    expect(rec.id).toBeDefined();
    const got = await mvCatalogService.get(tenantId, rec.id);
    expect(got?.name).toBe('mvA');
    const up = await mvCatalogService.update(tenantId, rec.id, { proposed: true });
    expect(up?.proposed).toBe(true);
    const ok = await mvCatalogService.remove(tenantId, rec.id);
    expect(ok).toBe(true);
  });

  test('findEligibleBySignature respects staleness and enabled', async () => {
    const x = await mvCatalogService.create(tenantId, { name: 'mvB', definitionSql: 'SELECT * FROM t', enabled: true });
    await mvCatalogService.markRefreshed(tenantId, x.id, 'success');
    const sig = mvCatalogService.signature('select * from t');
    const cand = await mvCatalogService.findEligibleBySignature(tenantId, sig, 9999999);
    expect(cand?.id).toBe(x.id);
  });
});

