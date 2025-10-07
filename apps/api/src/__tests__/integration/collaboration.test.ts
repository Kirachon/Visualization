import request from 'supertest';
import { app, server } from '../../server.js';

const agent = request.agent(app);

async function loginAsAdmin() {
  const res = await agent.post('/api/v1/auth/login').send({ username: 'admin', password: 'admin123' });
  expect(res.status).toBe(200);
  const token = res.body.token as string;
  return { agent, token };
}

describe('Collaboration API integration', () => {
  afterAll((done) => { server.close(done); });
  const dashboardId = 'dash-test-1';

  it('should create, list, resolve and unresolve comments', async () => {
    const { agent, token } = await loginAsAdmin();

    const create = await agent
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({ dashboardId, body: 'Hello world @viewer' });
    expect(create.status).toBe(201);
    const createdId = create.body.id;
    expect(createdId).toBeTruthy();

    const list1 = await agent
      .get('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .query({ dashboardId });
    expect(list1.status).toBe(200);
    expect(Array.isArray(list1.body)).toBe(true);
    expect(list1.body.some((c: any) => c.id === createdId)).toBe(true);

    const res1 = await agent
      .put(`/api/v1/comments/${createdId}/resolve`)
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(res1.status).toBe(204);

    const list2 = await agent
      .get('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .query({ dashboardId });
    const found2 = list2.body.find((c: any) => c.id === createdId);
    expect(found2).toBeTruthy();
    expect(found2.resolved).toBe(true);

    const res2 = await agent
      .put(`/api/v1/comments/${createdId}/unresolve`)
      .set('Authorization', `Bearer ${token}`)
      .send();
    expect(res2.status).toBe(204);

    const list3 = await agent
      .get('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .query({ dashboardId });
    const found3 = list3.body.find((c: any) => c.id === createdId);
    expect(found3).toBeTruthy();
    expect(found3.resolved).toBe(false);
  });

  it('should return active presence list (may be empty in test)', async () => {
    const { agent, token } = await loginAsAdmin();
    const res = await agent.get(`/api/v1/presence/${dashboardId}`).set('Authorization', `Bearer ${token}`).query({ withinSeconds: 60 });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

