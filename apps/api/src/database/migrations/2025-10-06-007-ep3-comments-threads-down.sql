-- Drop parent_id column and index (safe)
DROP INDEX IF EXISTS idx_comments_parent;
ALTER TABLE IF EXISTS comments DROP COLUMN IF EXISTS parent_id;
