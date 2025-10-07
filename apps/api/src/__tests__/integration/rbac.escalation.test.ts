import request from 'supertest';
import { app } from '../../server.js';

jest.setTimeout(20000);

describe('RBAC Access Escalation workflow', () => {
  async function login(username: string, password: string) {
    const agent = request(app);
    const res = await agent.post('/api/v1/auth/login').send({ username, password });
    expect(res.status).toBe(200);
    const token = res.body.token as string;
    return { agent, token };
  }

  it('denies viewer, then allows via approved escalation for comment:create', async () => {
    const viewer = await login('viewer', 'viewer123');

    // viewer tries to create a comment -> should be forbidden by authorize('comment','create')
    let res = await viewer.agent
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${viewer.token}`)
      .send({ dashboardId: 'd-escalate', body: 'need temp access', mentions: [] });
    expect([401,403]).toContain(res.status); // if auth pipeline varies, accept either unauthorized or forbidden
    if (res.status === 200 || res.status === 201) {
      throw new Error('Expected access to be denied for viewer before escalation');
    }

    // viewer requests escalation
    res = await viewer.agent
      .post('/api/v1/rbac/escalations')
      .set('Authorization', `Bearer ${viewer.token}`)
      .send({ resource: 'comment', action: 'create', reason: 'incident fix', ttlMs: 300000 });
    expect(res.status).toBe(201);
    const escalationId = res.body.id as string;

    // admin approves
    const admin = await login('admin', 'admin123');
    res = await admin.agent
      .post(`/api/v1/rbac/escalations/${escalationId}/approve`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send();
    expect(res.status).toBe(200);

    // viewer retries action -> should now succeed
    res = await viewer.agent
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${viewer.token}`)
      .send({ dashboardId: 'd-escalate', body: 'now allowed', mentions: [] });
    expect([200,201]).toContain(res.status);
  });
});

