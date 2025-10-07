/**
 * Migration Runner Script
 * 
 * Runs database migrations from the migrations directory.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/bi_platform';

async function runMigration(migrationFile: string) {
  const pool = new Pool({ connectionString: DATABASE_URL });
  
  try {
    console.log(`\n📦 Running migration: ${migrationFile}`);
    
    // Read migration file
    const migrationPath = path.join(__dirname, '..', 'src', 'database', 'migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf-8');
    
    // Execute migration
    await pool.query(sql);
    
    console.log(`✅ Migration completed successfully: ${migrationFile}`);
  } catch (error: any) {
    console.error(`❌ Migration failed: ${migrationFile}`);
    console.error(`Error: ${error.message}`);
    throw error;
  } finally {
    await pool.end();
  }
}

async function main() {
  const migrationFile = process.argv[2];
  
  if (!migrationFile) {
    console.error('Usage: npm run migrate <migration-file>');
    console.error('Example: npm run migrate 2025-10-06-010-import-jobs-up.sql');
    process.exit(1);
  }
  
  try {
    await runMigration(migrationFile);
    console.log('\n✨ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Migration failed!');
    process.exit(1);
  }
}

main();

