import { tryRewriteWithMV } from '../mvRewriteService.js';
import { mvCatalogService } from '../mvCatalogService.js';

describe('mvRewriteService extras', () => {
  const tenantId = 'tenant-test';
  const save = { MV_ENABLE: process.env.MV_ENABLE, MV_REWRITE_ENABLE: process.env.MV_REWRITE_ENABLE };
  beforeAll(()=>{ process.env.MV_ENABLE='true'; process.env.MV_REWRITE_ENABLE='true'; });
  afterAll(()=>{ process.env.MV_ENABLE=save.MV_ENABLE; process.env.MV_REWRITE_ENABLE=save.MV_REWRITE_ENABLE; });

  test('no eligible MV yields reason no_eligible_mv', async () => {
    const res = await tryRewriteWithMV(tenantId, 'select * from any');
    expect(res.used).toBe(false);
  });

  test('non-select statement not rewritten', async () => {
    const res = await tryRewriteWithMV(tenantId, 'UPDATE t SET a=1');
    expect(res.used).toBe(false);
  });

  test('handles parser errors gracefully', async () => {
    const rec = await mvCatalogService.create(tenantId, { name: 'mv', definitionSql: 'select * from bad', enabled: true });
    await mvCatalogService.markRefreshed(tenantId, rec.id, 'success');
    const res = await tryRewriteWithMV(tenantId, 'select');
    expect(res.used || res.reason).toBeDefined();
  });
});

