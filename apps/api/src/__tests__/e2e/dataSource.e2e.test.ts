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
    // Insert test tenant and role
    await client.query(`INSERT INTO tenants (id, name, slug) VALUES ('00000000-0000-0000-0000-000000000000', 'Test Tenant', 'test')`);
    await client.query(`INSERT INTO roles (id, name, tenant_id) VALUES ('00000000-0000-0000-0000-000000000001', 'Admin', '00000000-0000-0000-0000-000000000000')`);
    await client.query(`INSERT INTO users (id, username, email, password_hash, tenant_id, role_id) VALUES ('00000000-0000-0000-0000-000000000000', 'testuser', 'test@test.com', 'hash', '00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000001')`);
  } finally {
    client.release();
    await pool.end();
  }
}

describe('Data Source E2E', () => {
  beforeAll(async () => {
    await applySchema();
  });

  it('creates, tests, discovers schema, executes query, and deletes a data source', async () => {
    const testConfig = {
      host: 'localhost', port: 55432, database: 'testdb', username: 'postgres', password: 'postgres', ssl: false,
    };

    // 1) Create a data source pointing to the same test DB
    const createRes = await request(app)
      .post('/api/v1/data-sources')
      .send({
        name: 'Test DS',
        type: 'postgresql',
        connectionConfig: testConfig,
        tenantId: '00000000-0000-0000-0000-000000000000',
        ownerId: '00000000-0000-0000-0000-000000000000',
      })
      .expect(201);

    const dsId = createRes.body.id;
    expect(dsId).toBeDefined();

    // 2) Test connection using the original plain config
    const testRes = await request(app)
      .post('/api/v1/data-sources/test')
      .send({ connectionConfig: testConfig })
      .expect(200);
    expect(testRes.body.ok).toBe(true);

    // 3) Discover schema (will be empty tables but should succeed)
    const discRes = await request(app)
      .get(`/api/v1/data-sources/${dsId}/schema`)
      .query({ tenantId: '00000000-0000-0000-0000-000000000000' })
      .expect(200);
    expect(discRes.body).toHaveProperty('count');

    // 4) Execute a query (use encrypted config from response)
    const queryRes = await request(app)
      .post(`/api/v1/data-sources/${dsId}/query`)
      .send({
        connectionConfig: createRes.body.connectionConfig,
        sql: 'SELECT 1 as x',
        limit: 10,
      })
      .expect(200);
    expect(queryRes.body.rowCount).toBe(1);
    expect(queryRes.body.rows[0].x).toBe(1);

    // 5) Delete
    await request(app)
      .delete(`/api/v1/data-sources/${dsId}`)
      .query({ tenantId: '00000000-0000-0000-0000-000000000000' })
      .expect(204);
  });
});

