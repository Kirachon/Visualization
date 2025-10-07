-- Migration Rollback: Remove import_jobs table
-- Story: 2.2 - Multi-Database Connectivity
-- Date: 2025-10-06

-- Drop trigger
DROP TRIGGER IF EXISTS update_import_jobs_updated_at ON import_jobs;

-- Drop indexes
DROP INDEX IF EXISTS idx_import_jobs_tenant_id;
DROP INDEX IF EXISTS idx_import_jobs_data_source_id;
DROP INDEX IF EXISTS idx_import_jobs_status;
DROP INDEX IF EXISTS idx_import_jobs_created_by;
DROP INDEX IF EXISTS idx_import_jobs_created_at;

-- Drop table
DROP TABLE IF EXISTS import_jobs;

