-- Epic 3 / Story 3.2 Enterprise Auth — UP migration (backward compatible)

-- 1) users: add external identity + MFA fields (nullable; defaults safe)
ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS provider VARCHAR(32),
  ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS mfa_secret TEXT;

-- 2) idp_configs table
CREATE TABLE IF NOT EXISTS idp_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type VARCHAR(8) NOT NULL CHECK (type IN ('saml','oidc','ldap')),
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_idp_configs_tenant ON idp_configs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_idp_configs_type ON idp_configs(type);

-- 3) provisioning_events table
CREATE TABLE IF NOT EXISTS provisioning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  at TIMESTAMPTZ DEFAULT NOW(),
  raw JSONB
);
CREATE INDEX IF NOT EXISTS idx_provisioning_events_user ON provisioning_events(user_id);
CREATE INDEX IF NOT EXISTS idx_provisioning_events_type ON provisioning_events(type);
CREATE INDEX IF NOT EXISTS idx_provisioning_events_at ON provisioning_events(at);

