import request from 'supertest';
// Mock services
jest.mock('../../services/queryService.js', () => ({ queryService: { execute: jest.fn(async ()=>({ rows: [], rowCount: 0, durationMs: 1 })) } }));
import { app, server } from '../../server.js';
import { mvCatalogService } from '../../services/mvCatalogService.js';

describe('MV rewrite integration (olap disabled)', () => {
  const agent = request.agent(app);
  const old = { MV_ENABLE: process.env.MV_ENABLE, MV_REWRITE_ENABLE: process.env.MV_REWRITE_ENABLE, MV_CROSS_ENGINE_ENABLE: process.env.MV_CROSS_ENGINE_ENABLE, CLICKHOUSE_ENABLE: process.env.CLICKHOUSE_ENABLE };
  afterAll((done)=>{ process.env.MV_ENABLE=old.MV_ENABLE; process.env.MV_REWRITE_ENABLE=old.MV_REWRITE_ENABLE; process.env.MV_CROSS_ENGINE_ENABLE=old.MV_CROSS_ENGINE_ENABLE; process.env.CLICKHOUSE_ENABLE=old.CLICKHOUSE_ENABLE; server.close(done); });

  test('bypasses olap MV when cross-engine disabled', async () => {
    process.env.MV_ENABLE = 'true';
    process.env.MV_REWRITE_ENABLE = 'true';
    process.env.MV_CROSS_ENGINE_ENABLE = 'false';
    process.env.CLICKHOUSE_ENABLE = 'true';

    const login = await agent.post('/api/v1/auth/login').send({ username: 'admin', password: 'admin123' });
    expect(login.status).toBe(200);
    const tenantId = 'tenant-test';

    const mv = await mvCatalogService.create(tenantId, { name: 'mv_sales_ch', definitionSql: 'select * from sales', engine: 'olap', targetDatabase: 'analytics', enabled: true });
    await mvCatalogService.markRefreshed(tenantId, mv.id, 'success');

    const res = await agent.post('/api/v1/data-sources/ds1/query?tenantId=tenant-test')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ sql: 'select * from sales', connectionConfig: { host: 'h', port: 5432, database: 'd', username: 'u', password: 'p' } });
    expect(res.status).toBe(200);
    expect(res.body?.metadata?.mv?.used).toBe(false);
    expect(res.body?.metadata?.mv?.reason).toBe('cross_engine_disabled');
  });
});

