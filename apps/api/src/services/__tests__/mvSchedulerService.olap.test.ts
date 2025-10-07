import { refreshOnce } from '../../services/mvSchedulerService.js';
import { mvCatalogService } from '../../services/mvCatalogService.js';

jest.mock('../../services/clickhouseService.js', () => ({
  refreshMaterializedView: jest.fn(async () => true),
}));

describe('mvSchedulerService (olap)', () => {
  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.MV_CROSS_ENGINE_ENABLE = 'true';
  });

  const tenantId = 't1';

  it('dispatches to ClickHouse refresh for olap MV', async () => {
    const mv = await mvCatalogService.create(tenantId, { name: 'mv-ch', definitionSql: 'select 1', engine: 'olap', targetDatabase: 'analytics' });
    const status = await refreshOnce(tenantId, mv.id);
    expect(status).toBe('success');
    const rec = await mvCatalogService.get(tenantId, mv.id);
    expect(rec?.lastRefreshStatus).toBe('success');
  });
});

