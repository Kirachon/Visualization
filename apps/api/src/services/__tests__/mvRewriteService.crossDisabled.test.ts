import { tryRewriteWithMV } from '../../services/mvRewriteService.js';
import { mvCatalogService } from '../../services/mvCatalogService.js';

describe('mvRewriteService cross-engine disabled', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.MV_ENABLE = 'true';
    process.env.MV_REWRITE_ENABLE = 'true';
    process.env.MV_CROSS_ENGINE_ENABLE = 'false';
  });

  const tenantId = 't1';

  it('bypasses olap MV when MV_CROSS_ENGINE_ENABLE=false', async () => {
    const mv = await mvCatalogService.create(tenantId, { name: 'mv-ch', definitionSql: 'select c from t', engine: 'olap', targetDatabase: 'analytics', enabled: true });
    await mvCatalogService.markRefreshed(tenantId, mv.id, 'success');
    const res = await tryRewriteWithMV(tenantId, 'select c from t');
    expect(res.used).toBe(false);
    expect(res.reason).toBe('cross_engine_disabled');
  });
});

