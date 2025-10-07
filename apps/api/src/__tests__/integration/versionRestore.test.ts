import request from 'supertest';
import { app } from '../../server.js';

// Mock versionService.restore to avoid DB and focus on route behavior
jest.mock('../../services/versionService.js', () => ({
  versionService: {
    restore: jest.fn(async (id: string, tenantId: string, actorUserId: string) => ({ dashboardId: 'dash_1', applied: { name: 'Restored' } })),
  },
}));

jest.setTimeout(20000);

describe('Version restore endpoint', () => {
  async function login(username: string, password: string) {
    const agent = request(app);
    const res = await agent.post('/api/v1/auth/login').send({ username, password });
    expect(res.status).toBe(200);
    const token = res.body.token as string;
    return { agent, token };
  }

  it('restores a version and returns applied fields', async () => {
    const { agent, token } = await login('admin', 'admin123');

    const res = await agent
      .post('/api/v1/versions/v_1/restore')
      .set('Authorization', `Bearer ${token}`)
      .send({})
      .expect(200);

    expect(res.body).toEqual({ dashboardId: 'dash_1', applied: { name: 'Restored' } });
  });
});

