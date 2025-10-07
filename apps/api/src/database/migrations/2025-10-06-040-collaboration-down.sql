-- Rollback Migration: Collaboration Features (Story 3.3)
-- Description: Remove all collaboration tables and related objects
-- Author: Dev Agent (James)
-- Date: 2025-10-06

-- Remove workspace_id column from dashboards
ALTER TABLE dashboards DROP COLUMN IF EXISTS workspace_id;

-- Drop tables in reverse order (respecting foreign key dependencies)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS presence CASCADE;
DROP TABLE IF EXISTS shares CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS dashboard_versions CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS workspace_members CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;

-- Migration rollback complete

