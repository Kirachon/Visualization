-- Migration: Collaboration Features (Story 3.3)
-- Description: Real-time collaboration with comments, versions, workspaces, and activity feeds
-- Author: Dev Agent (James)
-- Date: 2025-10-06

-- ============================================================================
-- 1. WORKSPACES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}',
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_workspaces_tenant_id ON workspaces(tenant_id);
CREATE INDEX idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX idx_workspaces_is_default ON workspaces(is_default);

-- Create trigger for updated_at
CREATE TRIGGER update_workspaces_updated_at
    BEFORE UPDATE ON workspaces
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. WORKSPACE_MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS workspace_members (
    workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'member', -- 'owner', 'admin', 'member', 'viewer'
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    added_by UUID REFERENCES users(id),
    PRIMARY KEY (workspace_id, user_id)
);

-- Create indexes
CREATE INDEX idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user_id ON workspace_members(user_id);

-- ============================================================================
-- 3. COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- For threaded comments
    body TEXT NOT NULL,
    mentions UUID[] DEFAULT '{}', -- Array of mentioned user IDs
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_comments_tenant_id ON comments(tenant_id);
CREATE INDEX idx_comments_dashboard_id ON comments(dashboard_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_parent_id ON comments(parent_id);
CREATE INDEX idx_comments_resolved ON comments(resolved);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_mentions ON comments USING GIN(mentions);

-- Create trigger for updated_at
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. DASHBOARD_VERSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS dashboard_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    label VARCHAR(200), -- Optional version label (e.g., "v1.0", "Before redesign")
    diff JSONB NOT NULL, -- JSON diff of changes
    snapshot JSONB, -- Full snapshot of dashboard state (optional, for major versions)
    author_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dashboard_id, version)
);

-- Create indexes
CREATE INDEX idx_dashboard_versions_dashboard_id ON dashboard_versions(dashboard_id);
CREATE INDEX idx_dashboard_versions_author_id ON dashboard_versions(author_id);
CREATE INDEX idx_dashboard_versions_created_at ON dashboard_versions(created_at DESC);
CREATE INDEX idx_dashboard_versions_version ON dashboard_versions(dashboard_id, version DESC);

-- ============================================================================
-- 5. ACTIVITIES TABLE (Activity Feed)
-- ============================================================================
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    dashboard_id UUID REFERENCES dashboards(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- 'dashboard.created', 'dashboard.updated', 'comment.added', 'share.granted', etc.
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    details JSONB DEFAULT '{}', -- Additional event details
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_activities_tenant_id ON activities(tenant_id);
CREATE INDEX idx_activities_workspace_id ON activities(workspace_id);
CREATE INDEX idx_activities_dashboard_id ON activities(dashboard_id);
CREATE INDEX idx_activities_actor_id ON activities(actor_id);
CREATE INDEX idx_activities_type ON activities(type);
CREATE INDEX idx_activities_created_at ON activities(created_at DESC);

-- ============================================================================
-- 6. SHARES TABLE (Sharing Levels)
-- ============================================================================
CREATE TABLE IF NOT EXISTS shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    shared_with_role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_level VARCHAR(50) NOT NULL, -- 'view', 'comment', 'edit', 'admin'
    shared_by UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP, -- Optional expiration
    CHECK (
        (shared_with_user_id IS NOT NULL AND shared_with_role_id IS NULL) OR
        (shared_with_user_id IS NULL AND shared_with_role_id IS NOT NULL)
    )
);

-- Create indexes
CREATE INDEX idx_shares_tenant_id ON shares(tenant_id);
CREATE INDEX idx_shares_dashboard_id ON shares(dashboard_id);
CREATE INDEX idx_shares_shared_with_user_id ON shares(shared_with_user_id);
CREATE INDEX idx_shares_shared_with_role_id ON shares(shared_with_role_id);
CREATE INDEX idx_shares_shared_by ON shares(shared_by);
CREATE INDEX idx_shares_expires_at ON shares(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- 7. PRESENCE TABLE (Real-time Presence)
-- ============================================================================
CREATE TABLE IF NOT EXISTS presence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    dashboard_id UUID NOT NULL REFERENCES dashboards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cursor_position JSONB, -- { x, y, widgetId }
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dashboard_id, user_id)
);

-- Create indexes
CREATE INDEX idx_presence_tenant_id ON presence(tenant_id);
CREATE INDEX idx_presence_dashboard_id ON presence(dashboard_id);
CREATE INDEX idx_presence_user_id ON presence(user_id);
CREATE INDEX idx_presence_last_seen_at ON presence(last_seen_at);

-- ============================================================================
-- 8. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- 'mention', 'comment_reply', 'share', 'version_restore', etc.
    title VARCHAR(200) NOT NULL,
    body TEXT,
    link VARCHAR(500), -- Deep link to the relevant resource
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- ============================================================================
-- 9. ADD WORKSPACE_ID TO DASHBOARDS TABLE
-- ============================================================================
ALTER TABLE dashboards ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_dashboards_workspace_id ON dashboards(workspace_id);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

