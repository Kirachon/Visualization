import request from 'supertest';
import { app, server } from '../../server.js';

describe('MV list includes engine', () => {
  const agent = request.agent(app);
  afterAll((done)=>server.close(done));

  it('lists engine field', async () => {
    const c1 = await agent.post('/api/v1/mv').send({ name:'m1', definitionSql:'select 1', engine:'olap', targetDatabase:'analytics' });
    expect(c1.status).toBe(201);
    const list = await agent.get('/api/v1/mv');
    expect(list.status).toBe(200);
    const found = list.body.find((r:any)=>r.id===c1.body.id);
    expect(found.engine).toBe('olap');
  });
});

