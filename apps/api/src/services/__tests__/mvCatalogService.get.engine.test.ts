import { mvCatalogService } from '../../services/mvCatalogService.js';

describe('MVCatalogService get includes engine', ()=>{
  beforeAll(()=>{ process.env.NODE_ENV='test'; });
  const tenantId='t1';
  it('returns engine field', async ()=>{
    const rec = await mvCatalogService.create(tenantId, { name:'m1', definitionSql:'select 1', engine:'olap', targetDatabase:'analytics' });
    const got = await mvCatalogService.get(tenantId, rec.id);
    expect(got?.engine).toBe('olap');
  });
});

