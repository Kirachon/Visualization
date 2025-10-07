import { tryRewriteWithMV } from '../../services/mvRewriteService.js';
import { mvCatalogService } from '../../services/mvCatalogService.js';

describe('mvRewriteService (olap)', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.MV_ENABLE = 'true';
    process.env.MV_REWRITE_ENABLE = 'true';
    process.env.MV_CROSS_ENGINE_ENABLE = 'true';
  });

  const tenantId = 't1';

  it('rewrites to olap MV and includes engine hint and metadata', async () => {
    const mv = await mvCatalogService.create(tenantId, {
      name: 'mv-ch', definitionSql: 'select a from t', engine: 'olap', targetDatabase: 'analytics', enabled: true
    });
    await mvCatalogService.markRefreshed(tenantId, mv.id, 'success');

    const sql = 'select a from t';
    const res = await tryRewriteWithMV(tenantId, sql);
    expect(res.used).toBe(true);
    expect(res.engine).toBe('olap');
    expect(res.sql.toLowerCase()).toContain('/*+ engine=olap */'.toLowerCase());
    expect(res.sql).toContain('analytics');
  });

  it('does not rewrite when olap MV is not fresh', async () => {
    const mv2 = await mvCatalogService.create(tenantId, {
      name: 'mv-ch-stale', definitionSql: 'select b from t2', engine: 'olap', targetDatabase: 'analytics', enabled: true
    });
    const res2 = await tryRewriteWithMV(tenantId, 'select b from t2');
    expect(res2.used).toBe(false);
  });
});

