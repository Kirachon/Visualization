import request from 'supertest';
import { app, server } from '../../server.js';

jest.mock('../../services/mvSchedulerService.js', () => ({ refreshOnce: jest.fn(async ()=>'success') }));

describe('MV Catalog API (olap)', () => {
  const agent = request.agent(app);
  afterAll((done)=>server.close(done));

  it('creates olap MV with engine fields and refreshes', async () => {
    const create = await agent.post('/api/v1/mv').send({ name: 'mv-ch', definitionSql: 'SELECT * FROM t', engine: 'olap', targetDatabase: 'analytics', enabled: false });
    expect(create.status).toBe(201);
    const id = create.body.id;
    expect(create.body.engine).toBe('olap');
    expect(create.body.targetDatabase).toBe('analytics');

    const get = await agent.get(`/api/v1/mv/${id}`);
    expect(get.status).toBe(200);
    expect(get.body.engine).toBe('olap');

    const refresh = await agent.post(`/api/v1/mv/${id}/refresh`);
    expect(refresh.status).toBe(200);
    expect(refresh.body.status).toBe('success');
  });
});

