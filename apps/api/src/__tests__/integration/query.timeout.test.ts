import request from 'supertest';
import { app, server } from '../../server.js';

jest.mock('../../services/queryService.js', () => ({
  queryService: {
    execute: jest.fn(async () => { const e = new Error('canceling statement due to statement timeout'); throw e; })
  }
}));

describe('Query timeout mapping', () => {
  const agent = request.agent(app);
  afterAll((done) => { server.close(done); });

  it('maps statement timeout to 504', async () => {
    const login = await agent.post('/api/v1/auth/login').send({ username: 'admin', password: 'admin123' });
    const token = login.body.token;
    const body = { sql: 'select pg_sleep(100)', params: [], connectionConfig: { host: 'h', port: 5432, database: 'd', username: 'u', password: 'p' }, timeoutMs: 1000 };
    const r = await agent.post('/api/v1/data-sources/ds1/query').set('Authorization', `Bearer ${token}`).send(body);
    expect(r.status).toBe(504);
    expect(r.body.error).toMatch(/timeout/i);
  });
});

