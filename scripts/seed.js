import pg from 'pg';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

const { Pool } = pg;

// Load environment variables
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedDatabase() {
  console.log('Starting database seeding...');

  try {
    // Create default tenant
    const tenantResult = await pool.query(
      `INSERT INTO tenants (name, slug, settings)
       VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      ['Default Organization', 'default', JSON.stringify({ theme: 'light' })]
    );
    const tenantId = tenantResult.rows[0].id;
    console.log('✅ Created default tenant:', tenantId);

    // Create roles
    const viewerRoleResult = await pool.query(
      `INSERT INTO roles (name, description, tenant_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (name, tenant_id) DO UPDATE SET description = EXCLUDED.description
       RETURNING id`,
      ['Viewer', 'Can view dashboards and data', tenantId]
    );
    const viewerRoleId = viewerRoleResult.rows[0].id;
    console.log('✅ Created Viewer role:', viewerRoleId);

    const adminRoleResult = await pool.query(
      `INSERT INTO roles (name, description, tenant_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (name, tenant_id) DO UPDATE SET description = EXCLUDED.description
       RETURNING id`,
      ['Admin', 'Full system access', tenantId]
    );
    const adminRoleId = adminRoleResult.rows[0].id;
    console.log('✅ Created Admin role:', adminRoleId);

    // Create permissions for Admin role
    await pool.query(
      `INSERT INTO permissions (role_id, resource, action)
       VALUES 
         ($1, 'dashboards', 'create'),
         ($1, 'dashboards', 'read'),
         ($1, 'dashboards', 'update'),
         ($1, 'dashboards', 'delete'),
         ($1, 'users', 'create'),
         ($1, 'users', 'read'),
         ($1, 'users', 'update'),
         ($1, 'users', 'delete'),
         ($1, 'data_sources', 'create'),
         ($1, 'data_sources', 'read'),
         ($1, 'data_sources', 'update'),
         ($1, 'data_sources', 'delete')
       ON CONFLICT DO NOTHING`,
      [adminRoleId]
    );
    console.log('✅ Created Admin permissions');

    // Create permissions for Viewer role
    await pool.query(
      `INSERT INTO permissions (role_id, resource, action)
       VALUES 
         ($1, 'dashboards', 'read'),
         ($1, 'data_sources', 'read')
       ON CONFLICT DO NOTHING`,
      [viewerRoleId]
    );
    console.log('✅ Created Viewer permissions');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUserResult = await pool.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, tenant_id, role_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (username) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
      [
        'admin',
        'admin@biplatform.local',
        hashedPassword,
        'Admin',
        'User',
        tenantId,
        adminRoleId,
      ]
    );
    console.log('✅ Created admin user:', adminUserResult.rows[0].id);
    console.log('   Username: admin');
    console.log('   Password: admin123');

    // Create viewer user
    const viewerPassword = await bcrypt.hash('viewer123', 10);
    const viewerUserResult = await pool.query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, tenant_id, role_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (username) DO UPDATE SET email = EXCLUDED.email
       RETURNING id`,
      [
        'viewer',
        'viewer@biplatform.local',
        viewerPassword,
        'Viewer',
        'User',
        tenantId,
        viewerRoleId,
      ]
    );
    console.log('✅ Created viewer user:', viewerUserResult.rows[0].id);
    console.log('   Username: viewer');
    console.log('   Password: viewer123');

    console.log('\n✅ Database seeding completed successfully');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();

