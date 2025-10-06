-- Store OIDC refresh tokens encrypted (optional, flagged)
CREATE TABLE IF NOT EXISTS oidc_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  refresh_encrypted TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_oidc_tokens_user_provider ON oidc_tokens(user_id, provider);

