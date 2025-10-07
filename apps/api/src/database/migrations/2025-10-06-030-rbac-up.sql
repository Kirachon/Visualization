-- Migration: RBAC System (Story 3.1)
-- Description: Role-Based Access Control with row-level security, column masking, and audit logging
-- Author: Dev Agent (James)
-- Date: 2025-10-06

-- ============================================================================
-- 0. BACKUP AND RENAME EXISTING TABLES
-- ============================================================================
-- Rename existing roles and permissions tables to preserve data
ALTER TABLE IF EXISTS roles RENAME TO roles_old;
ALTER TABLE IF EXISTS permissions RENAME TO permissions_old;

-- ============================================================================
-- 1. ROLES TABLE (New RBAC Design)
-- ============================================================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    inherits_from UUID[] DEFAULT '{}',
    description TEXT,
    is_system BOOLEAN DEFAULT FALSE, -- System roles cannot be deleted
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_is_system ON roles(is_system);

-- Create trigger for updated_at
CREATE TRIGGER update_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. PERMISSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL, -- e.g., 'read', 'write', 'delete', 'share', 'admin'
    resource VARCHAR(100) NOT NULL, -- e.g., 'dashboard', 'datasource', 'user', 'role'
    condition JSONB, -- Optional conditions for fine-grained control
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_permissions_action ON permissions(action);
CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_action_resource ON permissions(action, resource);

-- ============================================================================
-- 3. ROLE_PERMISSIONS TABLE (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID REFERENCES users(id),
    PRIMARY KEY (role_id, permission_id)
);

-- Create indexes
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id);

-- ============================================================================
-- 4. USER_ROLES TABLE (Many-to-Many)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    expires_at TIMESTAMP, -- For temporary access
    PRIMARY KEY (user_id, role_id, tenant_id)
);

-- Create indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_tenant_id ON user_roles(tenant_id);
CREATE INDEX idx_user_roles_expires_at ON user_roles(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- 5. RLS_POLICIES TABLE (Row-Level Security)
-- ============================================================================
CREATE TABLE IF NOT EXISTS rls_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    predicate_sql TEXT NOT NULL, -- SQL WHERE clause (e.g., "department = :user_department")
    applies_to UUID[] NOT NULL, -- Array of role IDs
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0, -- Higher priority = applied first
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Create indexes
CREATE INDEX idx_rls_policies_tenant_id ON rls_policies(tenant_id);
CREATE INDEX idx_rls_policies_table_name ON rls_policies(table_name);
CREATE INDEX idx_rls_policies_is_active ON rls_policies(is_active);
CREATE INDEX idx_rls_policies_applies_to ON rls_policies USING GIN(applies_to);

-- Create trigger for updated_at
CREATE TRIGGER update_rls_policies_updated_at
    BEFORE UPDATE ON rls_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. COLUMN_MASKS TABLE (Column-Level Security)
-- ============================================================================
CREATE TABLE IF NOT EXISTS column_masks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    column_name VARCHAR(100) NOT NULL,
    strategy VARCHAR(50) NOT NULL, -- 'full', 'partial', 'hash', 'null'
    rule JSONB, -- Strategy-specific rules (e.g., {"keep_first": 4, "keep_last": 4})
    applies_to UUID[] NOT NULL, -- Array of role IDs
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Create indexes
CREATE INDEX idx_column_masks_tenant_id ON column_masks(tenant_id);
CREATE INDEX idx_column_masks_table_name ON column_masks(table_name);
CREATE INDEX idx_column_masks_column_name ON column_masks(column_name);
CREATE INDEX idx_column_masks_is_active ON column_masks(is_active);
CREATE INDEX idx_column_masks_applies_to ON column_masks USING GIN(applies_to);

-- Create trigger for updated_at
CREATE TRIGGER update_column_masks_updated_at
    BEFORE UPDATE ON column_masks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 7. ACCESS_AUDIT TABLE (Audit Logging with Tamper Protection)
-- ============================================================================
CREATE TABLE IF NOT EXISTS access_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- e.g., 'read', 'write', 'delete', 'login', 'logout'
    resource_type VARCHAR(100) NOT NULL, -- e.g., 'dashboard', 'datasource', 'user'
    resource_id UUID, -- ID of the resource accessed
    allowed BOOLEAN NOT NULL, -- TRUE if access was granted, FALSE if denied
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100), -- For correlation with application logs
    metadata JSONB, -- Additional context (e.g., query parameters, error details)
    hash_chain VARCHAR(64), -- SHA-256 hash of (previous_hash + current_record)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_access_audit_tenant_id ON access_audit(tenant_id);
CREATE INDEX idx_access_audit_user_id ON access_audit(user_id);
CREATE INDEX idx_access_audit_action ON access_audit(action);
CREATE INDEX idx_access_audit_resource_type ON access_audit(resource_type);
CREATE INDEX idx_access_audit_resource_id ON access_audit(resource_id);
CREATE INDEX idx_access_audit_allowed ON access_audit(allowed);
CREATE INDEX idx_access_audit_created_at ON access_audit(created_at DESC);
CREATE INDEX idx_access_audit_ip_address ON access_audit(ip_address);

-- ============================================================================
-- 8. ACCESS_ESCALATIONS TABLE (Temporary Access Requests)
-- ============================================================================
CREATE TABLE IF NOT EXISTS access_escalations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'denied', 'expired'
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id),
    review_notes TEXT,
    expires_at TIMESTAMP, -- When the temporary access expires
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_access_escalations_tenant_id ON access_escalations(tenant_id);
CREATE INDEX idx_access_escalations_user_id ON access_escalations(user_id);
CREATE INDEX idx_access_escalations_role_id ON access_escalations(role_id);
CREATE INDEX idx_access_escalations_status ON access_escalations(status);
CREATE INDEX idx_access_escalations_requested_at ON access_escalations(requested_at DESC);
CREATE INDEX idx_access_escalations_expires_at ON access_escalations(expires_at) WHERE expires_at IS NOT NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_access_escalations_updated_at
    BEFORE UPDATE ON access_escalations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. SEED DEFAULT ROLES
-- ============================================================================
INSERT INTO roles (id, name, description, is_system) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Viewer', 'Read-only access to dashboards and data', TRUE),
    ('00000000-0000-0000-0000-000000000002', 'Analyst', 'Create and edit dashboards, run queries', TRUE),
    ('00000000-0000-0000-0000-000000000003', 'Designer', 'Full dashboard design capabilities, manage data sources', TRUE),
    ('00000000-0000-0000-0000-000000000004', 'Admin', 'Manage users, roles, and tenant settings', TRUE),
    ('00000000-0000-0000-0000-000000000005', 'SuperAdmin', 'Full system access, manage all tenants', TRUE)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 10. SEED DEFAULT PERMISSIONS
-- ============================================================================
INSERT INTO permissions (action, resource, description) VALUES
    -- Dashboard permissions
    ('read', 'dashboard', 'View dashboards'),
    ('write', 'dashboard', 'Create and edit dashboards'),
    ('delete', 'dashboard', 'Delete dashboards'),
    ('share', 'dashboard', 'Share dashboards with others'),
    
    -- Data source permissions
    ('read', 'datasource', 'View data sources'),
    ('write', 'datasource', 'Create and edit data sources'),
    ('delete', 'datasource', 'Delete data sources'),
    ('query', 'datasource', 'Execute queries on data sources'),
    
    -- User permissions
    ('read', 'user', 'View user information'),
    ('write', 'user', 'Create and edit users'),
    ('delete', 'user', 'Delete users'),
    
    -- Role permissions
    ('read', 'role', 'View roles'),
    ('write', 'role', 'Create and edit roles'),
    ('delete', 'role', 'Delete roles'),
    ('assign', 'role', 'Assign roles to users'),
    
    -- Tenant permissions
    ('read', 'tenant', 'View tenant information'),
    ('write', 'tenant', 'Edit tenant settings'),
    ('admin', 'tenant', 'Full tenant administration'),
    
    -- System permissions
    ('admin', 'system', 'System administration')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 11. ASSIGN PERMISSIONS TO DEFAULT ROLES
-- ============================================================================
-- Viewer: Read-only access
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000001', id FROM permissions
WHERE (action = 'read' AND resource IN ('dashboard', 'datasource'))
ON CONFLICT DO NOTHING;

-- Analyst: Viewer + query + write dashboards
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000002', id FROM permissions
WHERE (action = 'read' AND resource IN ('dashboard', 'datasource'))
   OR (action = 'query' AND resource = 'datasource')
   OR (action = 'write' AND resource = 'dashboard')
   OR (action = 'share' AND resource = 'dashboard')
ON CONFLICT DO NOTHING;

-- Designer: Analyst + manage data sources
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000003', id FROM permissions
WHERE resource IN ('dashboard', 'datasource')
ON CONFLICT DO NOTHING;

-- Admin: Designer + manage users and roles
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000004', id FROM permissions
WHERE resource IN ('dashboard', 'datasource', 'user', 'role', 'tenant')
ON CONFLICT DO NOTHING;

-- SuperAdmin: All permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT '00000000-0000-0000-0000-000000000005', id FROM permissions
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

