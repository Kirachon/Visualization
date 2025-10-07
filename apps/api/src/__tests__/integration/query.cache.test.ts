import request from 'supertest';
import { app, server } from '../../server.js';

// Mock queryService to simulate expensive first call
jest.mock('../../services/queryService.js', () => ({
  queryService: {
    execute: jest.fn(async ({ sql }) => {
      if ((global as any).__firstCallDone) {
        return { rows: [{ v: 2 }], rowCount: 1, durationMs: 2 };
      }
      (global as any).__firstCallDone = true;
      await new Promise(r => setTimeout(r, 50));
      return { rows: [{ v: 1 }], rowCount: 1, durationMs: 50 };
    })
  }
}));

describe('Query cache', () => {
  const agent = request.agent(app);
  afterAll((done) => { server.close(done); });

  it('returns cacheHit on second identical request', async () => {
    process.env.QUERY_CACHE_TTL_MS = '60000';
    // login
    const login = await agent.post('/api/v1/auth/login').send({ username: 'admin', password: 'admin123' });
    expect(login.status).toBe(200);
    const token = login.body.token;

    const body = { sql: 'select 1 as v', params: [], connectionConfig: { host: 'h', port: 5432, database: 'd', username: 'u', password: 'p' } };

    const r1 = await agent.post('/api/v1/data-sources/ds1/query').set('Authorization', `Bearer ${token}`).send(body);
    expect(r1.status).toBe(200);
    expect(r1.body.metadata.cacheHit).toBe(false);

    const r2 = await agent.post('/api/v1/data-sources/ds1/query').set('Authorization', `Bearer ${token}`).send(body);
    expect(r2.status).toBe(200);
    expect(r2.body.metadata.cacheHit).toBe(true);
    expect(r2.body.rowCount).toBe(1);
  });
});

