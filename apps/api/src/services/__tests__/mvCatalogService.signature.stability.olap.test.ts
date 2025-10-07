import { mvCatalogService } from '../../services/mvCatalogService.js';

describe('MV signature stability independent of engine', () => {
  beforeAll(()=>{ process.env.NODE_ENV='test'; });
  const tenantId='t1';
  it('signature is same regardless of engine field', async () => {
    const sql='select a, sum(b) from t group by a';
    const s1 = mvCatalogService.signature(sql);
    const rec1 = await mvCatalogService.create(tenantId, { name:'m1', definitionSql: sql, engine:'oltp' });
    const rec2 = await mvCatalogService.create(tenantId, { name:'m2', definitionSql: sql, engine:'olap' });
    expect(rec1.normalizedSignature).toBe(s1);
    expect(rec2.normalizedSignature).toBe(s1);
  });
});

