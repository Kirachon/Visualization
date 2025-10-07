import { mvCatalogService } from '../../services/mvCatalogService.js';

describe('MVCatalogService engine validation', () => {
  beforeAll(()=>{ process.env.NODE_ENV='test'; });
  const tenantId='t1';
  it('throws on invalid engine value', async () => {
    await expect(mvCatalogService.create(tenantId, { name:'bad', definitionSql:'select 1', engine: 'nope' as any })).rejects.toThrow();
  });
});

