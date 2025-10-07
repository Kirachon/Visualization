import request from 'supertest';
jest.mock('../../services/queryService.js', () => ({ queryService: { execute: jest.fn(async ()=>({ rows: [{x:1}], rowCount: 1, durationMs: 2 })) } }));
import { app, server } from '../../server.js';

describe('Query path with MV flags disabled', () => {
  const agent = request.agent(app);
  afterAll((done)=>server.close(done));

  it('does not include mv metadata when disabled', async () => {
    process.env.MV_ENABLE = 'false';
    process.env.MV_REWRITE_ENABLE = 'false';
    const login = await agent.post('/api/v1/auth/login').send({ username: 'admin', password: 'admin123' });
    expect(login.status).toBe(200);
    const res = await agent.post('/api/v1/data-sources/ds1/query')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ sql: 'select * from t', connectionConfig: { host: 'h', port: 5432, database: 'd', username: 'u', password: 'p' } });
    expect(res.status).toBe(200);
    // mv field may be absent when disabled
    expect(res.body?.metadata?.mv === undefined || res.body?.metadata?.mv?.used === false).toBe(true);
  });
});

