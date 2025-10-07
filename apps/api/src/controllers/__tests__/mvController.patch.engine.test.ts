import request from 'supertest';
import { app, server } from '../../server.js';

describe('MV Controller patch engine', () => {
  const agent = request.agent(app);
  afterAll((done)=>server.close(done));

  it('updates engine to olap', async () => {
    const create = await agent.post('/api/v1/mv').send({ name: 'mvx', definitionSql: 'select 1' });
    expect(create.status).toBe(201);
    const id = create.body.id;
    const patch = await agent.patch(`/api/v1/mv/${id}`).send({ engine: 'olap', targetDatabase: 'analytics' });
    expect(patch.status).toBe(200);
    expect(patch.body.engine).toBe('olap');
  });
});

