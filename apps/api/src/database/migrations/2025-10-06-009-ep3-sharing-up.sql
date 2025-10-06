-- Basic sharing table for dashboards (backward-compatible, optional enforcement)
CREATE TYPE IF NOT EXISTS share_level AS ENUM ('view','comment','edit','admin');

CREATE TABLE IF NOT EXISTS dashboard_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL CHECK (subject_type IN ('user','role')),
  subject_id UUID NOT NULL,
  level share_level NOT NULL,
  start_at TIMESTAMPTZ DEFAULT NOW(),
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shares_dash ON dashboard_shares(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_shares_subject ON dashboard_shares(subject_id);

