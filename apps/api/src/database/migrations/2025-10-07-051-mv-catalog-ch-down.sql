ALTER TABLE materialized_views
  DROP COLUMN IF EXISTS ch_opts,
  DROP COLUMN IF EXISTS target_database,
  DROP COLUMN IF EXISTS engine;

