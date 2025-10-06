-- Add parent_id for threaded comments (backward compatible)
ALTER TABLE IF EXISTS comments
  ADD COLUMN IF NOT EXISTS parent_id UUID NULL REFERENCES comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);

