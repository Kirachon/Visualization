import request from 'supertest';
import { app, server } from '../../server.js';

describe('MV API 404 cases', () => {
  const agent = request.agent(app);
  afterAll((done)=>server.close(done));

  test('get non-existent returns 404', async () => {
    const res = await agent.get('/api/v1/mv/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });

  test('patch non-existent returns 404', async () => {
    const res = await agent.patch('/api/v1/mv/00000000-0000-0000-0000-000000000000').send({ enabled: true });
    expect(res.status).toBe(404);
  });

  test('refresh non-existent returns 404', async () => {
    const res = await agent.post('/api/v1/mv/00000000-0000-0000-0000-000000000000/refresh');
    expect(res.status).toBe(404);
  });
});

