-- Epic 3 / Story 3.5 Advanced Security — UP migration (backward compatible)

-- 1) encryption_keys table
CREATE TABLE IF NOT EXISTS encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kid TEXT NOT NULL UNIQUE,
  algo TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  rotated_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','rotated','revoked'))
);
CREATE INDEX IF NOT EXISTS idx_encryption_keys_status ON encryption_keys(status);

-- 2) retention_policies table
CREATE TABLE IF NOT EXISTS retention_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type TEXT NOT NULL UNIQUE,
  ttl_days INTEGER NOT NULL,
  hard_delete BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) gdpr_requests table
CREATE TABLE IF NOT EXISTS gdpr_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('rtbf','export')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_subject ON gdpr_requests(subject_id);
CREATE INDEX IF NOT EXISTS idx_gdpr_requests_status ON gdpr_requests(status);

-- 4) vuln_findings table
CREATE TABLE IF NOT EXISTS vuln_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,
  severity TEXT NOT NULL,
  package TEXT,
  version TEXT,
  cve TEXT,
  at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'open' CHECK (status IN ('open','mitigated','false_positive'))
);
CREATE INDEX IF NOT EXISTS idx_vuln_findings_severity ON vuln_findings(severity);
CREATE INDEX IF NOT EXISTS idx_vuln_findings_status ON vuln_findings(status);

-- 5) ids_events table
CREATE TABLE IF NOT EXISTS ids_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  src_ip TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  at TIMESTAMPTZ DEFAULT NOW(),
  action TEXT
);
CREATE INDEX IF NOT EXISTS idx_ids_events_src_ip ON ids_events(src_ip);
CREATE INDEX IF NOT EXISTS idx_ids_events_at ON ids_events(at);

