-- Epic 3 / Story 3.4 Metadata Management — DOWN migration (rollback)

DROP TABLE IF EXISTS search_index;
DROP TABLE IF EXISTS impact_records;
DROP TABLE IF EXISTS data_quality_metrics;
DROP TABLE IF EXISTS glossary_terms;
DROP TABLE IF EXISTS metadata_lineage;
DROP TABLE IF EXISTS metadata_assets;

