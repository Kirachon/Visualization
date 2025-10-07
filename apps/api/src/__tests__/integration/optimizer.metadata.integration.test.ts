import request from 'supertest';
import { app, server } from '../../server.js';

// Mock queryService to avoid real DB
jest.mock('../../services/queryService.js', () => ({
  queryService: {
    execute: jest.fn(async () => ({ rows: [{ v: 1 }], rowCount: 1, durationMs: 5 }))
  }
}));

describe('Optimizer metadata integration', () => {
  const old = process.env.OPTIMIZER_ENABLE;
  const agent = request.agent(app);
  afterAll((done) => { process.env.OPTIMIZER_ENABLE = old; server.close(done); });

  test('query response includes optimizer metadata when enabled', async () => {
    process.env.OPTIMIZER_ENABLE = 'true';
    // login first
    const login = await agent.post('/api/v1/auth/login').send({ username: 'admin', password: 'admin123' });
    expect(login.status).toBe(200);
    const token = login.body.token;

    const res = await agent
      .post('/api/v1/data-sources/ds1/query')
      .set('Authorization', `Bearer ${token}`)
      .send({ sql: 'SELECT * FROM t WHERE id=1', connectionConfig: { host: 'h', port: 5432, database: 'd', username: 'u', password: 'p' } });
    expect(res.status).toBe(200);
    expect(res.body?.metadata?.optimizer).toBeDefined();
    expect(res.body?.metadata?.optimizer?.analyzed).toBe(true);
  });
});

