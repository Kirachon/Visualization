-- Migration: Add import_jobs table for tracking file import operations
-- Story: 2.2 - Multi-Database Connectivity
-- Date: 2025-10-06

-- Create import_jobs table
CREATE TABLE IF NOT EXISTS import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    data_source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT,
    file_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    progress JSONB DEFAULT '{"totalRows": 0, "processedRows": 0, "successfulRows": 0, "failedRows": 0, "percentage": 0}'::jsonb,
    error_count INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]'::jsonb,
    options JSONB DEFAULT '{}'::jsonb,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for import_jobs
CREATE INDEX IF NOT EXISTS idx_import_jobs_tenant_id ON import_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_data_source_id ON import_jobs(data_source_id);
CREATE INDEX IF NOT EXISTS idx_import_jobs_status ON import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_by ON import_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_import_jobs_created_at ON import_jobs(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_import_jobs_updated_at BEFORE UPDATE ON import_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE import_jobs IS 'Tracks file import jobs for data sources';
COMMENT ON COLUMN import_jobs.progress IS 'JSON object containing import progress: {totalRows, processedRows, successfulRows, failedRows, percentage}';
COMMENT ON COLUMN import_jobs.errors IS 'JSON array of import errors: [{row, error, data}]';
COMMENT ON COLUMN import_jobs.options IS 'JSON object containing import options: {batchSize, mode, etc.}';

