-- Materialized Views Catalog
CREATE TABLE IF NOT EXISTS materialized_views (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  name TEXT NOT NULL,
  definition_sql TEXT NOT NULL,
  target_table TEXT NOT NULL,
  normalized_signature TEXT NOT NULL,
  freshness_ttl_ms INTEGER NOT NULL DEFAULT 600000,
  refresh_interval_ms INTEGER NOT NULL DEFAULT 600000,
  last_refreshed_at TIMESTAMPTZ NULL,
  last_refresh_status TEXT NOT NULL DEFAULT 'never',
  enabled BOOLEAN NOT NULL DEFAULT false,
  proposed BOOLEAN NOT NULL DEFAULT false,
  usage_count_24h INTEGER NOT NULL DEFAULT 0,
  dependencies JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mv_tenant ON materialized_views(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mv_tenant_enabled ON materialized_views(tenant_id, enabled);
CREATE INDEX IF NOT EXISTS idx_mv_signature ON materialized_views(tenant_id, normalized_signature);

