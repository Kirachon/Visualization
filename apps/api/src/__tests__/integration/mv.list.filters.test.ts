import request from 'supertest';
import { app, server } from '../../server.js';

describe('MV list filters', () => {
  const agent = request.agent(app);
  afterAll((done)=>server.close(done));

  test('list with enabled/proposed filters', async () => {
    const c1 = await agent.post('/api/v1/mv').send({ name: 'mv1', definitionSql: 'select 1', enabled: true });
    const c2 = await agent.post('/api/v1/mv').send({ name: 'mv2', definitionSql: 'select 2', proposed: true });
    expect(c1.status).toBe(201); expect(c2.status).toBe(201);

    const en = await agent.get('/api/v1/mv?enabled=true');
    expect(en.status).toBe(200);
    expect(en.body.every((r:any)=>r.enabled)).toBe(true);

    const pr = await agent.get('/api/v1/mv?proposed=true');
    expect(pr.status).toBe(200);
    expect(pr.body.every((r:any)=>r.proposed)).toBe(true);
  });
});

