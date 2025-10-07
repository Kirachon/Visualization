-- Migration: Add filter_sets and filter_metrics tables for advanced filtering
-- Story: 2.3 - Advanced Filtering & Cross-Filtering
-- Date: 2025-10-06

-- Create filter_sets table for saved filter configurations
CREATE TABLE IF NOT EXISTS filter_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    dashboard_id UUID REFERENCES dashboards(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    predicates JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_global BOOLEAN DEFAULT false,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for filter_sets
CREATE INDEX IF NOT EXISTS idx_filter_sets_tenant_id ON filter_sets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_filter_sets_dashboard_id ON filter_sets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_filter_sets_created_by ON filter_sets(created_by);
CREATE INDEX IF NOT EXISTS idx_filter_sets_created_at ON filter_sets(created_at);

-- Create filter_metrics table for performance monitoring
CREATE TABLE IF NOT EXISTS filter_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    dashboard_id UUID REFERENCES dashboards(id) ON DELETE CASCADE,
    predicate_hash VARCHAR(64) NOT NULL,
    duration_ms INTEGER NOT NULL,
    cache_hit BOOLEAN DEFAULT false,
    row_count INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for filter_metrics
CREATE INDEX IF NOT EXISTS idx_filter_metrics_tenant_id ON filter_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_filter_metrics_dashboard_id ON filter_metrics(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_filter_metrics_predicate_hash ON filter_metrics(predicate_hash);
CREATE INDEX IF NOT EXISTS idx_filter_metrics_created_at ON filter_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_filter_metrics_cache_hit ON filter_metrics(cache_hit);

-- Create trigger for updated_at on filter_sets
CREATE TRIGGER update_filter_sets_updated_at BEFORE UPDATE ON filter_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE filter_sets IS 'Stores saved filter configurations for dashboards';
COMMENT ON COLUMN filter_sets.predicates IS 'JSON array of filter predicates: [{field, op, value, values, range}]';
COMMENT ON COLUMN filter_sets.is_global IS 'Whether this filter set applies globally across all dashboards';

COMMENT ON TABLE filter_metrics IS 'Tracks filter evaluation performance metrics';
COMMENT ON COLUMN filter_metrics.predicate_hash IS 'SHA-256 hash of the predicate for caching';
COMMENT ON COLUMN filter_metrics.duration_ms IS 'Time taken to evaluate the filter in milliseconds';
COMMENT ON COLUMN filter_metrics.cache_hit IS 'Whether the result was served from cache';

