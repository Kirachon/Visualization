-- Rollback Migration: RBAC System (Story 3.1)
-- Description: Remove all RBAC tables and related objects
-- Author: Dev Agent (James)
-- Date: 2025-10-06

-- Drop tables in reverse order (respecting foreign key dependencies)
DROP TABLE IF EXISTS access_escalations CASCADE;
DROP TABLE IF EXISTS access_audit CASCADE;
DROP TABLE IF EXISTS column_masks CASCADE;
DROP TABLE IF EXISTS rls_policies CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Migration rollback complete

