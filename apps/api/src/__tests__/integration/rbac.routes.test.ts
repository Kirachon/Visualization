import request from 'supertest';
import { app, server } from '../../server.js';

// Mock rbacService to avoid DB
jest.mock('../../services/rbacService.js', () => ({
  rbacService: {
    getRoles: jest.fn(async () => ([{ id: 'role_admin', name: 'Admin', inheritsFrom: [], description: 'Admin', isSystem: true }])),
    createRole: jest.fn(async (name: string) => ({ id: 'role_new', name, inheritsFrom: [], description: '', isSystem: false })),
    getRolePermissions: jest.fn(async (id: string) => (id ? [{ id: 'perm1', action: 'read', resource: 'dashboard' }] : [])),
    assignRole: jest.fn(async () => {}),
    revokeRole: jest.fn(async () => {}),
  }
}));

const agent = request.agent(app);

async function loginAsAdmin() {
  const res = await agent.post('/api/v1/auth/login').send({ username: 'admin', password: 'admin123' });
  expect(res.status).toBe(200);
  return res.body.token as string;
}

describe('RBAC Routes', () => {
  afterAll((done) => { server.close(done); });

  it('GET /rbac/roles lists roles (Admin only)', async () => {
    const token = await loginAsAdmin();
    const res = await agent
      .get('/api/v1/rbac/roles')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe('Admin');
  });

  it('POST /rbac/roles creates a role', async () => {
    const token = await loginAsAdmin();
    const res = await agent
      .post('/api/v1/rbac/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Analyst' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Analyst');
  });

  it('GET /rbac/roles/:id/permissions returns permissions', async () => {
    const token = await loginAsAdmin();
    const res = await agent
      .get('/api/v1/rbac/roles/role_admin/permissions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body[0].resource).toBe('dashboard');
  });

  it('POST /rbac/assign assigns a role to a user', async () => {
    const token = await loginAsAdmin();
    const res = await agent
      .post('/api/v1/rbac/assign')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: 'u1', roleId: 'role_viewer', tenantId: 't1' });
    expect(res.status).toBe(204);
  });

  it('DELETE /rbac/assign revokes a role from a user', async () => {
    const token = await loginAsAdmin();
    const res = await agent
      .delete('/api/v1/rbac/assign')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: 'u1', roleId: 'role_viewer', tenantId: 't1' });
    expect(res.status).toBe(204);
  });
});

