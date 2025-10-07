import { tryRewriteWithMV } from '../mvRewriteService.js';
import { mvCatalogService } from '../mvCatalogService.js';

describe('mvRewriteService', () => {
  const tenantId = 'tenant-test';
  const oldFlags = { MV_ENABLE: process.env.MV_ENABLE, MV_REWRITE_ENABLE: process.env.MV_REWRITE_ENABLE };
  beforeAll(()=>{ process.env.MV_ENABLE='true'; process.env.MV_REWRITE_ENABLE='true'; });
  afterAll(()=>{ process.env.MV_ENABLE=oldFlags.MV_ENABLE; process.env.MV_REWRITE_ENABLE=oldFlags.MV_REWRITE_ENABLE; });

  test('rewrites to MV when eligible', async () => {
    const def = 'SELECT * FROM sales';
    const mv = await mvCatalogService.create(tenantId, { name: 'mv_sales', definitionSql: def, enabled: true });
    await mvCatalogService.markRefreshed(tenantId, mv.id, 'success');
    const res = await tryRewriteWithMV(tenantId, 'select * from sales');
    expect(res.used).toBe(true);
    expect(res.mvId).toBe(mv.id);
  });

  test('does not rewrite when disabled', async () => {
    process.env.MV_REWRITE_ENABLE = 'false';
    const res = await tryRewriteWithMV(tenantId, 'select * from sales');
    expect(res.used).toBe(false);
  });
});

