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
    await client.query(`INSERT INTO users (id, username, email, password_hash, tenant_id, role_id) VALUES ('00000000-0000-0000-0000-000000000000', 'owner', 'owner@test.com', 'hash', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001')`);
    await client.query(`INSERT INTO users (id, username, email, password_hash, tenant_id, role_id) VALUES ('11111111-1111-1111-1111-111111111111', 'user1', 'user1@test.com', 'hash', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001')`);
  } finally {
    client.release();
    await pool.end();
  }
}

describe('Dashboard Sharing E2E', () => {
  beforeAll(async () => {
    await applySchema();
  });

  it('shares dashboard, lists shares, and revokes access', async () => {
    // 1) Create dashboard
    const dashboardRes = await request(app)
      .post('/api/v1/dashboards')
      .send({
        name: 'Shared Dashboard',
        tenantId: '00000000-0000-0000-0000-000000000000',
        ownerId: '00000000-0000-0000-0000-000000000000',
      })
      .expect(201);

    const dashboardId = dashboardRes.body.id;

    // 2) Share with user
    const shareRes = await request(app)
      .post(`/api/v1/dashboards/${dashboardId}/share`)
      .send({
        userId: '11111111-1111-1111-1111-111111111111',
        permission: 'view',
        createdBy: '00000000-0000-0000-0000-000000000000',
      })
      .expect(201);

    expect(shareRes.body.userId).toBe('11111111-1111-1111-1111-111111111111');
    expect(shareRes.body.permission).toBe('view');

    // 3) List shares
    const listRes = await request(app)
      .get(`/api/v1/dashboards/${dashboardId}/shares`)
      .expect(200);

    expect(listRes.body.length).toBe(1);

    // 4) Revoke share
    await request(app)
      .delete(`/api/v1/dashboards/${dashboardId}/share/11111111-1111-1111-1111-111111111111`)
      .expect(204);

    // 5) Verify share removed
    const listRes2 = await request(app)
      .get(`/api/v1/dashboards/${dashboardId}/shares`)
      .expect(200);

    expect(listRes2.body.length).toBe(0);
  });

  it('creates and accesses public link', async () => {
    // 1) Create dashboard
    const dashboardRes = await request(app)
      .post('/api/v1/dashboards')
      .send({
        name: 'Public Dashboard',
        tenantId: '00000000-0000-0000-0000-000000000000',
        ownerId: '00000000-0000-0000-0000-000000000000',
      })
      .expect(201);

    const dashboardId = dashboardRes.body.id;

    // 2) Create public link
    const linkRes = await request(app)
      .post(`/api/v1/dashboards/${dashboardId}/public-link`)
      .send({
        createdBy: '00000000-0000-0000-0000-000000000000',
      })
      .expect(201);

    const token = linkRes.body.token;
    expect(token).toBeDefined();

    // 3) Access via public link
    const publicRes = await request(app)
      .get(`/api/v1/public/dashboards/${token}`)
      .expect(200);

    expect(publicRes.body.dashboardId).toBe(dashboardId);

    // 4) List public links
    const listRes = await request(app)
      .get(`/api/v1/dashboards/${dashboardId}/public-links`)
      .expect(200);

    expect(listRes.body.length).toBe(1);

    // 5) Revoke public link
    const linkId = linkRes.body.id;
    await request(app)
      .delete(`/api/v1/dashboards/${dashboardId}/public-links/${linkId}`)
      .expect(204);

    // 6) Verify link revoked
    await request(app)
      .get(`/api/v1/public/dashboards/${token}`)
      .expect(404);
  });
});

