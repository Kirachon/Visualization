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
    await client.query(`INSERT INTO users (id, username, email, password_hash, tenant_id, role_id) VALUES ('00000000-0000-0000-0000-000000000000', 'testuser', 'test@test.com', 'hash', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001')`);
  } finally {
    client.release();
    await pool.end();
  }
}

describe('Dashboard E2E', () => {
  beforeAll(async () => {
    await applySchema();
  });

  it('creates, lists, updates, and deletes a dashboard', async () => {
    // 1) Create
    const createRes = await request(app)
      .post('/api/v1/dashboards')
      .send({
        name: 'Test Dashboard',
        description: 'A test dashboard',
        tenantId: '00000000-0000-0000-0000-000000000000',
        ownerId: '00000000-0000-0000-0000-000000000000',
      })
      .expect(201);

    const dashboardId = createRes.body.id;
    expect(dashboardId).toBeDefined();
    expect(createRes.body.name).toBe('Test Dashboard');

    // 2) List
    const listRes = await request(app)
      .get('/api/v1/dashboards')
      .query({ tenantId: '00000000-0000-0000-0000-000000000000' })
      .expect(200);
    expect(listRes.body.length).toBeGreaterThan(0);

    // 3) Get by ID
    const getRes = await request(app)
      .get(`/api/v1/dashboards/${dashboardId}`)
      .query({ tenantId: '00000000-0000-0000-0000-000000000000' })
      .expect(200);
    expect(getRes.body.id).toBe(dashboardId);

    // 4) Update
    const updateRes = await request(app)
      .put(`/api/v1/dashboards/${dashboardId}`)
      .send({
        name: 'Updated Dashboard',
        tenantId: '00000000-0000-0000-0000-000000000000',
      })
      .expect(200);
    expect(updateRes.body.name).toBe('Updated Dashboard');

    // 5) Delete
    await request(app)
      .delete(`/api/v1/dashboards/${dashboardId}`)
      .query({ tenantId: '00000000-0000-0000-0000-000000000000' })
      .expect(204);
  });
});

