# Database Schema

### ClickHouse Schema (Analytics)

```sql
-- Dashboard fact table
CREATE TABLE dashboard_events (
    event_id UUID,
    dashboard_id UUID,
    user_id UUID,
    tenant_id UUID,
    event_type String,
    event_data String,
    timestamp DateTime,
    date Date MATERIALIZED toDate(timestamp)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (tenant_id, dashboard_id, user_id, timestamp);

-- Query performance metrics
CREATE TABLE query_metrics (
    query_id UUID,
    user_id UUID,
    tenant_id UUID,
    data_source_id UUID,
    query_text String,
    execution_time_ms UInt32,
    rows_returned UInt64,
    bytes_returned UInt64,
    timestamp DateTime,
    date Date MATERIALIZED toDate(timestamp)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (tenant_id, data_source_id, user_id, timestamp);

-- User activity analytics
CREATE TABLE user_activity (
    activity_id UUID,
    user_id UUID,
    tenant_id UUID,
    session_id String,
    activity_type String,
    resource_type String,
    resource_id String,
    timestamp DateTime,
    date Date MATERIALIZED toDate(timestamp)
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (tenant_id, user_id, session_id, timestamp);
```

### PostgreSQL Schema (Metadata)

```sql
-- Users and authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    tenant_id UUID NOT NULL,
    role_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- User roles and permissions
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id),
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    conditions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dashboards
CREATE TABLE dashboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tenant_id UUID NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id),
    layout JSONB NOT NULL,
    components JSONB NOT NULL,
    filters JSONB,
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE
);

-- Dashboard permissions
CREATE TABLE dashboard_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dashboard_id UUID NOT NULL REFERENCES dashboards(id),
    user_id UUID REFERENCES users(id),
    role_id UUID REFERENCES roles(id),
    permission_type VARCHAR(20) NOT NULL, -- 'view', 'edit', 'share', 'admin'
    granted_by UUID REFERENCES users(id),
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(dashboard_id, user_id, role_id)
);

-- Data sources
CREATE TABLE data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    connection_config JSONB NOT NULL,
    tenant_id UUID NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id),
    schema_info JSONB,
    status VARCHAR(20) DEFAULT 'active',
    last_tested_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data source schemas
CREATE TABLE data_source_schemas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_source_id UUID NOT NULL REFERENCES data_sources(id),
    schema_name VARCHAR(255),
    table_name VARCHAR(255),
    column_name VARCHAR(255),
    data_type VARCHAR(100),
    is_nullable BOOLEAN DEFAULT true,
    column_default TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(data_source_id, schema_name, table_name, column_name)
);

-- Saved queries
CREATE TABLE saved_queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    query_text TEXT NOT NULL,
    data_source_id UUID NOT NULL REFERENCES data_sources(id),
    user_id UUID NOT NULL REFERENCES users(id),
    tenant_id UUID NOT NULL,
    parameters JSONB,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    query_id UUID REFERENCES saved_queries(id),
    condition_config JSONB NOT NULL,
    notification_config JSONB NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    tenant_id UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alert history
CREATE TABLE alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES alerts(id),
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    condition_met BOOLEAN NOT NULL,
    notification_sent BOOLEAN DEFAULT false,
    error_message TEXT
);

-- Tenants
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    settings JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_dashboards_tenant_id ON dashboards(tenant_id);
CREATE INDEX idx_dashboards_owner_id ON dashboards(owner_id);
CREATE INDEX idx_dashboard_permissions_dashboard_id ON dashboard_permissions(dashboard_id);
CREATE INDEX idx_dashboard_permissions_user_id ON dashboard_permissions(user_id);
CREATE INDEX idx_data_sources_tenant_id ON data_sources(tenant_id);
CREATE INDEX idx_saved_queries_tenant_id ON saved_queries(tenant_id);
CREATE INDEX idx_saved_queries_data_source_id ON saved_queries(data_source_id);
CREATE INDEX idx_alerts_tenant_id ON alerts(tenant_id);
CREATE INDEX idx_alert_history_alert_id ON alert_history(alert_id);
```

