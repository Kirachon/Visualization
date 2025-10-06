import request from 'supertest';
import { app } from '../../server.js';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const TEST_DB_URL = process.env.TEST_DATABASE_URL || 'postgres://postgres:postgres@localhost:55432/testdb';
process.env.DATABASE_URL = TEST_DB_URL;
process.env.ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || Buffer.alloc(32, 1).toString('base64');
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

async function applySchema() {
  const sqlPath = path.resolve(__dirname, '../../database/schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const pool = new Pool({ connectionString: TEST_DB_URL });
  const client = await pool.connect();
  try {
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await client.query(sql);
    await client.query(`INSERT INTO tenants (id, name, slug) VALUES ('00000000-0000-0000-0000-000000000000', 'Test Tenant', 'test')`);
    await client.query(`INSERT INTO roles (id, name, tenant_id) VALUES ('00000000-0000-0000-0000-000000000001', 'Admin', '00000000-0000-0000-0000-000000000000')`);
  } finally {
    client.release();
    await pool.end();
  }
}

describe('User Management E2E', () => {
  beforeAll(async () => {
    await applySchema();
  });

  it('creates, lists, updates, and deletes a user', async () => {
    // 1) Create user
    const createRes = await request(app)
      .post('/api/v1/users')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        roleId: '00000000-0000-0000-0000-000000000001',
        tenantId: '00000000-0000-0000-0000-000000000000',
      })
      .expect(201);

    const userId = createRes.body.id;
    expect(userId).toBeDefined();
    expect(createRes.body.email).toBe('test@example.com');
    expect(createRes.body.passwordHash).toBeUndefined(); // Should not return password

    // 2) List users
    const listRes = await request(app)
      .get('/api/v1/users')
      .query({ tenantId: '00000000-0000-0000-0000-000000000000' })
      .expect(200);
    expect(listRes.body.length).toBeGreaterThan(0);

    // 3) Get user by ID
    const getRes = await request(app)
      .get(`/api/v1/users/${userId}`)
      .query({ tenantId: '00000000-0000-0000-0000-000000000000' })
      .expect(200);
    expect(getRes.body.id).toBe(userId);

    // 4) Update user
    const updateRes = await request(app)
      .put(`/api/v1/users/${userId}`)
      .send({
        firstName: 'Updated',
        phoneNumber: '+1234567890',
        tenantId: '00000000-0000-0000-0000-000000000000',
      })
      .expect(200);
    expect(updateRes.body.firstName).toBe('Updated');
    expect(updateRes.body.phoneNumber).toBe('+1234567890');

    // 5) Delete user
    await request(app)
      .delete(`/api/v1/users/${userId}`)
      .query({ tenantId: '00000000-0000-0000-0000-000000000000' })
      .expect(204);

    // 6) Verify user is deleted (soft delete)
    await request(app)
      .get(`/api/v1/users/${userId}`)
      .query({ tenantId: '00000000-0000-0000-0000-000000000000' })
      .expect(404);
  });

  it('handles password reset flow', async () => {
    // 1) Create user
    const createRes = await request(app)
      .post('/api/v1/users')
      .send({
        username: 'resetuser',
        email: 'reset@example.com',
        password: 'oldpassword123',
        firstName: 'Reset',
        lastName: 'User',
        roleId: '00000000-0000-0000-0000-000000000001',
        tenantId: '00000000-0000-0000-0000-000000000000',
      })
      .expect(201);

    // 2) Initiate password reset
    const initiateRes = await request(app)
      .post('/api/v1/users/password-reset/initiate')
      .send({ email: 'reset@example.com' })
      .expect(200);
    
    expect(initiateRes.body.message).toBeDefined();
    const token = initiateRes.body.token; // Only available in test env

    // 3) Complete password reset
    if (token) {
      await request(app)
        .post('/api/v1/users/password-reset/complete')
        .send({ token, newPassword: 'newpassword123' })
        .expect(200);
    }
  });
});

