-- Migration: Rollback filter_sets and filter_metrics tables
-- Story: 2.3 - Advanced Filtering & Cross-Filtering
-- Date: 2025-10-06

-- Drop triggers
DROP TRIGGER IF EXISTS update_filter_sets_updated_at ON filter_sets;

-- Drop indexes
DROP INDEX IF EXISTS idx_filter_metrics_cache_hit;
DROP INDEX IF EXISTS idx_filter_metrics_created_at;
DROP INDEX IF EXISTS idx_filter_metrics_predicate_hash;
DROP INDEX IF EXISTS idx_filter_metrics_dashboard_id;
DROP INDEX IF EXISTS idx_filter_metrics_tenant_id;

DROP INDEX IF EXISTS idx_filter_sets_created_at;
DROP INDEX IF EXISTS idx_filter_sets_created_by;
DROP INDEX IF EXISTS idx_filter_sets_dashboard_id;
DROP INDEX IF EXISTS idx_filter_sets_tenant_id;

-- Drop tables
DROP TABLE IF EXISTS filter_metrics;
DROP TABLE IF EXISTS filter_sets;

