-- Epic 3 / Story 3.4 Metadata Management — UP migration (backward compatible)

-- 1) metadata_assets table
CREATE TABLE IF NOT EXISTS metadata_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  tags JSONB DEFAULT '[]'::jsonb,
  attrs JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_metadata_assets_type ON metadata_assets(type);
CREATE INDEX IF NOT EXISTS idx_metadata_assets_owner ON metadata_assets(owner_id);

-- 2) metadata_lineage table
CREATE TABLE IF NOT EXISTS metadata_lineage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  src_asset_id UUID NOT NULL REFERENCES metadata_assets(id) ON DELETE CASCADE,
  dst_asset_id UUID NOT NULL REFERENCES metadata_assets(id) ON DELETE CASCADE,
  edge JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_metadata_lineage_src ON metadata_lineage(src_asset_id);
CREATE INDEX IF NOT EXISTS idx_metadata_lineage_dst ON metadata_lineage(dst_asset_id);

-- 3) glossary_terms table
CREATE TABLE IF NOT EXISTS glossary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  term TEXT NOT NULL UNIQUE,
  definition TEXT,
  synonyms JSONB DEFAULT '[]'::jsonb,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  related_terms JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_term ON glossary_terms(term);
CREATE INDEX IF NOT EXISTS idx_glossary_terms_owner ON glossary_terms(owner_id);

-- 4) data_quality_metrics table
CREATE TABLE IF NOT EXISTS data_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES metadata_assets(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  value NUMERIC,
  at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_asset ON data_quality_metrics(asset_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_metrics_at ON data_quality_metrics(at);

-- 5) impact_records table
CREATE TABLE IF NOT EXISTS impact_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_ref TEXT NOT NULL,
  impacted_asset_id UUID NOT NULL REFERENCES metadata_assets(id) ON DELETE CASCADE,
  details JSONB DEFAULT '{}'::jsonb,
  at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_impact_records_change ON impact_records(change_ref);
CREATE INDEX IF NOT EXISTS idx_impact_records_asset ON impact_records(impacted_asset_id);

-- 6) search_index table (simplified; tsvector for full-text search)
CREATE TABLE IF NOT EXISTS search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES metadata_assets(id) ON DELETE CASCADE,
  tokens TSVECTOR
);
CREATE INDEX IF NOT EXISTS idx_search_index_tokens ON search_index USING GIN(tokens);
CREATE INDEX IF NOT EXISTS idx_search_index_asset ON search_index(asset_id);

