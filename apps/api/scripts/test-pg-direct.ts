import { Pool } from 'pg';

async function test() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'bi_platform',
    user: 'postgres',
    password: 'password',
  });
  
  try {
    const result = await pool.query('SELECT version()');
    console.log('✅ Connection successful!');
    console.log('Version:', result.rows[0].version);
  } catch (error: any) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await pool.end();
  }
}

test();

