import { mvCatalogService } from '../../services/mvCatalogService.js';

describe('MVCatalogService (cross-engine)', () => {
  beforeAll(() => { process.env.NODE_ENV = 'test'; });
  const tenantId = 't1';

  it('defaults engine to oltp when not provided', async () => {
    const rec = await mvCatalogService.create(tenantId, { name: 'mv1', definitionSql: 'select 1' });
    expect(rec.engine).toBe('oltp');
  });

  it('accepts engine=olap with targetDatabase and chOpts', async () => {
    const rec = await mvCatalogService.create(tenantId, { name: 'mv2', definitionSql: 'select 1', engine: 'olap', targetDatabase: 'analytics', chOpts: { orderBy: ['ts'] } });
    expect(rec.engine).toBe('olap');
    expect(rec.targetDatabase).toBe('analytics');
    expect(rec.chOpts).toBeTruthy();
  });

  it('updates engine fields', async () => {
    const rec = await mvCatalogService.create(tenantId, { name: 'mv3', definitionSql: 'select 1' });
    const updated = await mvCatalogService.update(tenantId, rec.id, { engine: 'olap', targetDatabase: 'analytics' });
    expect(updated?.engine).toBe('olap');
    expect(updated?.targetDatabase).toBe('analytics');
  });
});

