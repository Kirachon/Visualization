import request from 'supertest';
import { app, server } from '../../server.js';

jest.mock('../../services/mvSchedulerService.js', () => ({ refreshOnce: jest.fn(async ()=>'success') }));

describe('MV Catalog API', () => {
  const agent = request.agent(app);
  afterAll((done)=>server.close(done));

  it('creates, lists, gets, updates, deletes MV', async () => {
    const create = await agent.post('/api/v1/mv').send({ name: 'mv1', definitionSql: 'SELECT * FROM t', enabled: false });
    expect(create.status).toBe(201);
    const id = create.body.id;

    const list = await agent.get('/api/v1/mv');
    expect(list.status).toBe(200);
    expect(Array.isArray(list.body)).toBe(true);

    const get = await agent.get(`/api/v1/mv/${id}`);
    expect(get.status).toBe(200);
    expect(get.body.name).toBe('mv1');

    const patch = await agent.patch(`/api/v1/mv/${id}`).send({ enabled: true });
    expect(patch.status).toBe(200);
    expect(patch.body.enabled).toBe(true);

    const refresh = await agent.post(`/api/v1/mv/${id}/refresh`);
    expect(refresh.status).toBe(200);
    expect(refresh.body.status).toBe('success');

    const del = await agent.delete(`/api/v1/mv/${id}`);
    expect(del.status).toBe(204);
  });
});

