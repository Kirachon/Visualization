-- Epic 3 / Story 3.1 RBAC — UP migration (backward compatible)

-- 1) users: add department and region (nullable)
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS department VARCHAR(100),
  ADD COLUMN IF NOT EXISTS region VARCHAR(100);

-- 2) rls_policies table
CREATE TABLE IF NOT EXISTS rls_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  predicate_sql TEXT NOT NULL,
  applies_to VARCHAR(64) NOT NULL CHECK (applies_to IN ('data')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rls_policies_tenant ON rls_policies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rls_policies_applies ON rls_policies(applies_to);

-- 3) column_masks table
CREATE TABLE IF NOT EXISTS column_masks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  table_name VARCHAR(255) NOT NULL,
  column_name VARCHAR(255) NOT NULL,
  strategy VARCHAR(32) NOT NULL CHECK (strategy IN ('full','partial','hash')),
  rule JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (tenant_id, table_name, column_name)
);
CREATE INDEX IF NOT EXISTS idx_column_masks_tenant ON column_masks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_column_masks_table_col ON column_masks(table_name, column_name);

-- 4) audit_logs: add tamper-proof hash chain columns
ALTER TABLE IF EXISTS audit_logs
  ADD COLUMN IF NOT EXISTS prev_hash TEXT,
  ADD COLUMN IF NOT EXISTS hash TEXT;
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

