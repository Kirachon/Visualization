import { refreshOnce } from '../../services/mvSchedulerService.js';
import { mvCatalogService } from '../../services/mvCatalogService.js';

jest.mock('../../services/clickhouseService.js', () => ({
  refreshMaterializedView: jest.fn(async () => { throw new Error('boom'); }),
}));

describe('mvSchedulerService failure handling', () => {
  beforeAll(()=>{ process.env.NODE_ENV='test'; process.env.MV_CROSS_ENGINE_ENABLE='true'; });
  const tenantId='t1';
  it('marks failed when CH refresh throws', async () => {
    const mv = await mvCatalogService.create(tenantId, { name:'m1', definitionSql:'select 1', engine:'olap', targetDatabase:'analytics' });
    const status = await refreshOnce(tenantId, mv.id);
    expect(status).toBe('failed');
  });
});

