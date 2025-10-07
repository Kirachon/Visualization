import { tryRewriteWithMV } from '../../services/mvRewriteService.js';
import { mvCatalogService } from '../../services/mvCatalogService.js';

describe('mvRewriteService hint', () => {
  beforeAll(() => { process.env.NODE_ENV='test'; process.env.MV_ENABLE='true'; process.env.MV_REWRITE_ENABLE='true'; process.env.MV_CROSS_ENGINE_ENABLE='true'; });
  const tenantId='t1';
  it('does not add olap hint for oltp MV', async () => {
    const mv = await mvCatalogService.create(tenantId, { name:'m1', definitionSql:'select x from t', engine:'oltp', enabled: true });
    await mvCatalogService.markRefreshed(tenantId, mv.id, 'success');
    const res = await tryRewriteWithMV(tenantId, 'select x from t');
    expect(res.used).toBe(true);
    expect((res.sql || '').toLowerCase()).not.toContain('engine=olap');
    expect(res.engine).toBe('oltp');
  });
});

