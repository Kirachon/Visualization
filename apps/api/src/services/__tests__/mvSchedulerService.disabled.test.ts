import { refreshOnce } from '../../services/mvSchedulerService.js';
import { mvCatalogService } from '../../services/mvCatalogService.js';

describe('mvSchedulerService cross-engine disabled behavior', () => {
  beforeAll(() => { process.env.NODE_ENV = 'test'; process.env.MV_CROSS_ENGINE_ENABLE = 'false'; });
  const tenantId = 't1';

  it('fails refresh for olap MV when cross-engine disabled', async () => {
    const mv = await mvCatalogService.create(tenantId, { name: 'mv-chx', definitionSql: 'select 1', engine: 'olap', targetDatabase: 'analytics' });
    const status = await refreshOnce(tenantId, mv.id);
    expect(status).toBe('failed');
  });
});

