-- Epic 3 / Story 3.5 Advanced Security — DOWN migration (rollback)

DROP TABLE IF EXISTS ids_events;
DROP TABLE IF EXISTS vuln_findings;
DROP TABLE IF EXISTS gdpr_requests;
DROP TABLE IF EXISTS retention_policies;
DROP TABLE IF EXISTS encryption_keys;

