import { mvCatalogService } from '../mvCatalogService.js';

describe('mvCatalogService extras', () => {
  const tenantId = 'tenant-test';

  test('update recalculates signature on definition change', async () => {
    const rec = await mvCatalogService.create(tenantId, { name: 'mvX', definitionSql: 'SELECT * FROM a', enabled: true });
    const sig1 = rec.normalizedSignature;
    const up = await mvCatalogService.update(tenantId, rec.id, { definitionSql: 'select * from b' });
    expect(up?.normalizedSignature).not.toBe(sig1);
  });

  test('list filters by enabled and proposed', async () => {
    await mvCatalogService.create(tenantId, { name: 'mvE', definitionSql: 'select * from e', enabled: true });
    await mvCatalogService.create(tenantId, { name: 'mvP', definitionSql: 'select * from p', enabled: false, proposed: true });
    const en = await mvCatalogService.list(tenantId, { enabled: true });
    expect(en.every(r=>r.enabled)).toBe(true);
    const pr = await mvCatalogService.list(tenantId, { proposed: true });
    expect(pr.every(r=>r.proposed)).toBe(true);
  });

  test('remove non-existent returns true (idempotent)', async () => {
    const ok = await mvCatalogService.remove(tenantId, '00000000-0000-0000-0000-000000000000');
    expect(ok).toBe(true);
  });

  test('markRefreshed sets lastRefreshedAt and status', async () => {
    const rec = await mvCatalogService.create(tenantId, { name: 'mvY', definitionSql: 'select * from y', enabled: true });
    await mvCatalogService.markRefreshed(tenantId, rec.id, 'success');
    const got = await mvCatalogService.get(tenantId, rec.id);
    expect(got?.lastRefreshedAt).toBeTruthy();
    expect(got?.lastRefreshStatus).toBe('success');
  });

  test('findEligibleBySignature returns null when stale or disabled', async () => {
    const rec = await mvCatalogService.create(tenantId, { name: 'mvZ', definitionSql: 'select * from z', enabled: false });
    await mvCatalogService.markRefreshed(tenantId, rec.id, 'success');
    const sig = mvCatalogService.signature('select * from z');
    const cand = await mvCatalogService.findEligibleBySignature(tenantId, sig, 1); // too strict
    expect(cand).toBeNull();
  });
});

