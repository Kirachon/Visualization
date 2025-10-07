import request from 'supertest';
import { app, server } from '../../server.js';

jest.mock('../../services/clickhouseService.js', () => ({
  clickhouseService: {
    execute: jest.fn(async ({ sql }) => ({ rows: [{ v: 100, sql }], rowCount: 1, durationMs: 3 }))
  }
}));

jest.mock('../../services/queryService.js', () => ({
  queryService: {
    execute: jest.fn(async ({ sql }) => ({ rows: [{ v: 200, sql }], rowCount: 1, durationMs: 7 }))
  }
}));

describe('OLAP path (ClickHouse) integration', () => {
  const agent = request.agent(app);
  afterAll((done) => { server.close(done); });

  beforeEach(() => {
    (global as any).__firstCallDone = false;
    process.env.QUERY_CACHE_TTL_MS = '60000';
  });

  it('uses OLAP engine when CH enabled and query is analytical (GROUP BY)', async () => {
    process.env.CLICKHOUSE_ENABLE = 'true';

    // login
    const login = await agent.post('/api/v1/auth/login').send({ username: 'admin', password: 'admin123' });
    expect(login.status).toBe(200);
    const token = login.body.token;

    const body = { sql: 'select a, count(*) from t group by a', params: [], connectionConfig: { host: 'h', port: 5432, database: 'd', username: 'u', password: 'p' } };

    const r = await agent.post('/api/v1/data-sources/ds1/query').set('Authorization', `Bearer ${token}`).send(body);
    expect(r.status).toBe(200);
    expect(r.body.metadata.engine).toBe('olap');
    expect(r.body.metadata.cacheHit).toBe(false);
    expect(r.body.rowCount).toBe(1);
    expect(r.body.rows[0].v).toBe(100);
  });

  it('falls back to OLTP when CH disabled; metadata.engine reflects oltp', async () => {
    process.env.CLICKHOUSE_ENABLE = 'false';

    const login = await agent.post('/api/v1/auth/login').send({ username: 'admin', password: 'admin123' });
    expect(login.status).toBe(200);
    const token = login.body.token;

    const body = { sql: '/*+ engine=olap */ select 1 as v', params: [], connectionConfig: { host: 'h', port: 5432, database: 'd', username: 'u', password: 'p' } };

    const r = await agent.post('/api/v1/data-sources/ds1/query').set('Authorization', `Bearer ${token}`).send(body);
    expect(r.status).toBe(200);
    expect(r.body.metadata.engine).toBe('oltp');
    expect(r.body.metadata.cacheHit).toBe(false);
    expect(r.body.rowCount).toBe(1);
    expect(r.body.rows[0].v).toBe(200);
  });

  it('cache is isolated per engine (OLAP vs OLTP)', async () => {
    process.env.CLICKHOUSE_ENABLE = 'true';

    const login = await agent.post('/api/v1/auth/login').send({ username: 'admin', password: 'admin123' });
    expect(login.status).toBe(200);
    const token = login.body.token;

    const sql = 'select 1 as v';

    // 1) OLAP request (force with useOlap)
    const r1 = await agent.post('/api/v1/data-sources/ds1/query').set('Authorization', `Bearer ${token}`).send({ sql, useOlap: true, params: [], connectionConfig: { host: 'h', port: 5432, database: 'd', username: 'u', password: 'p' } });
    expect(r1.status).toBe(200);
    expect(r1.body.metadata.engine).toBe('olap');
    expect(r1.body.metadata.cacheHit).toBe(false);
    expect(r1.body.rows[0].v).toBe(100);

    // 2) OLTP request same SQL (no hint / no preferOlap)
    const r2 = await agent.post('/api/v1/data-sources/ds1/query').set('Authorization', `Bearer ${token}`).send({ sql, params: [], connectionConfig: { host: 'h', port: 5432, database: 'd', username: 'u', password: 'p' } });
    expect(r2.status).toBe(200);
    expect(r2.body.metadata.engine).toBe('oltp');
    expect(r2.body.metadata.cacheHit).toBe(false);
    expect(r2.body.rows[0].v).toBe(200);

    // 3) OLAP request again should be cache hit
    const r3 = await agent.post('/api/v1/data-sources/ds1/query').set('Authorization', `Bearer ${token}`).send({ sql, useOlap: true, params: [], connectionConfig: { host: 'h', port: 5432, database: 'd', username: 'u', password: 'p' } });
    expect(r3.status).toBe(200);
    expect(r3.body.metadata.engine).toBe('olap');
    expect(r3.body.metadata.cacheHit).toBe(true);
    expect(r3.body.rows[0].v).toBe(100);
  });
});

