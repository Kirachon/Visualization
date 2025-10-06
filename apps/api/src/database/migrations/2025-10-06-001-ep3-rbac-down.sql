-- Epic 3 / Story 3.1 RBAC — DOWN migration (rollback)

-- 4) audit_logs: drop hash columns
ALTER TABLE IF EXISTS audit_logs
  DROP COLUMN IF EXISTS hash,
  DROP COLUMN IF EXISTS prev_hash;

-- 3) column_masks: drop table
DROP TABLE IF EXISTS column_masks;

-- 2) rls_policies: drop table
DROP TABLE IF EXISTS rls_policies;

-- 1) users: drop department and region columns
ALTER TABLE IF EXISTS users
  DROP COLUMN IF EXISTS region,
  DROP COLUMN IF EXISTS department;

