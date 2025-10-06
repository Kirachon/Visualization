-- Epic 3 / Story 3.2 Enterprise Auth — DOWN migration (rollback)

-- 3) provisioning_events table
DROP TABLE IF EXISTS provisioning_events;

-- 2) idp_configs table
DROP TABLE IF EXISTS idp_configs;

-- 1) users: drop added columns
ALTER TABLE IF EXISTS users
  DROP COLUMN IF EXISTS mfa_secret,
  DROP COLUMN IF EXISTS mfa_enabled,
  DROP COLUMN IF EXISTS provider,
  DROP COLUMN IF EXISTS external_id;

