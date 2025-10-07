import request from 'supertest';
jest.mock('../../services/queryService.js', () => ({ queryService: { execute: jest.fn(async ()=>({ rows: [], rowCount: 0, durationMs: 1 })) } }));
import { app, server } from '../../server.js';

describe('MV metadata when no eligible MV', () => {
  const agent = request.agent(app);
  const old = { MV_ENABLE: process.env.MV_ENABLE, MV_REWRITE_ENABLE: process.env.MV_REWRITE_ENABLE };
  afterAll((done)=>{ process.env.MV_ENABLE=old.MV_ENABLE; process.env.MV_REWRITE_ENABLE=old.MV_REWRITE_ENABLE; server.close(done); });

  test('mv.used=false with reason when enabled but no eligible', async () => {
    process.env.MV_ENABLE = 'true';
    process.env.MV_REWRITE_ENABLE = 'true';
    const login = await agent.post('/api/v1/auth/login').send({ username: 'admin', password: 'admin123' });
    const res = await agent.post('/api/v1/data-sources/ds1/query')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ sql: 'select * from notmv', connectionConfig: { host: 'h', port: 5432, database: 'd', username: 'u', password: 'p' } });
    expect(res.status).toBe(200);
    expect(res.body?.metadata?.mv?.used).toBe(false);
  });
});

