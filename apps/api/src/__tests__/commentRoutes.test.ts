import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../server.js';

// Helper to create a valid auth token
function makeToken(overrides: Partial<any> = {}) {
  const payload = {
    userId: 'u1',
    username: 'tester',
    tenantId: 't1',
    roleId: 'r1',
    roleName: 'admin',
    ...overrides,
  };
  const secret = process.env.JWT_SECRET || 'test-jwt-secret';
  return jwt.sign(payload, secret, { expiresIn: '1h' });
}

describe('Comment Routes validation', () => {
  it('POST /api/v1/comments requires dashboardId and body', async () => {
    const token = makeToken();
    const res = await request(app)
      .post('/api/v1/comments')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});

