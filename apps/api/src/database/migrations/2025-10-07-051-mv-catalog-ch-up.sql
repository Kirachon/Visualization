ALTER TABLE materialized_views
  ADD COLUMN IF NOT EXISTS engine TEXT NOT NULL DEFAULT 'oltp' CHECK (engine IN ('oltp','olap')),
  ADD COLUMN IF NOT EXISTS target_database TEXT NULL,
  ADD COLUMN IF NOT EXISTS ch_opts JSONB NOT NULL DEFAULT '{}'::jsonb;

-- indexes remain unchanged; existing rows default to engine='oltp'

