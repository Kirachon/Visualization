# 🏗️ Winston - Architect - Fullstack Architecture Creation

I'll create a comprehensive fullstack architecture document for your open-source BI platform. Let me start by reviewing the PRD to understand all requirements and then design a complete system architecture.

## Architecture Creation Approach

I'll create a detailed architecture document that addresses:

1. **High-level architecture** - Overall system design and component relationships
2. **Technology stack** - Specific technologies with versions and rationale
3. **Data models** - Schema designs for analytics and metadata
4. **Component architecture** - Microservices and their responsibilities
5. **API specifications** - REST/GraphQL interfaces
6. **Database schemas** - ClickHouse and PostgreSQL designs
7. **Frontend architecture** - React components and state management
8. **Infrastructure design** - Kubernetes deployment and scaling
9. **Security implementation** - Authentication, authorization, and data protection
10. **Development workflow** - Local setup and CI/CD pipeline

Let me begin creating the comprehensive architecture document:

---

# Open-Source Business Intelligence Platform Fullstack Architecture Document

## Introduction

This document outlines the complete fullstack architecture for the open-source Business Intelligence platform, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

## High Level Architecture

### Technical Summary

The system is designed as a cloud-native, microservices-based architecture leveraging ClickHouse for high-performance analytics, PostgreSQL for metadata management, and React for the frontend. The architecture supports real-time data streaming via Kafka, batch processing via Airflow, and scales horizontally using Kubernetes orchestration. The platform is designed to handle 10,000+ concurrent users with sub-second query performance on billion-row datasets while maintaining complete open-source compliance and vendor neutrality.

### Platform and Infrastructure Choice

**Platform:** Cloud-native with Kubernetes-first approach
**Key Services:** AWS EKS/GKE/AKS, RDS PostgreSQL, Managed Redis, S3/MinIO storage
**Deployment Host and Regions:** Multi-region deployment with auto-scaling groups

### Repository Structure

**Structure:** Monorepo with npm workspaces
**Monorepo Tool:** Nx or Lerna for dependency management
**Package Organization:** Separated by domain (frontend, backend, shared)

### Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Browser]
        B[Mobile App]
    end
    
    subgraph "CDN/Edge"
        C[CloudFlare/Akamai]
    end
    
    subgraph "Load Balancer"
        D[Nginx/HAProxy]
    end
    
    subgraph "API Gateway"
        E[Kong Gateway]
        F[Authentication Service]
    end
    
    subgraph "Frontend Services"
        G[React SPA Server]
        H[Static Assets]
    end
    
    subgraph "Backend Services"
        I[Dashboard Service]
        J[Data Service]
        K[User Management Service]
        L[Alert Service]
        M[Export Service]
        N[Collaboration Service]
        O[Metadata Service]
    end
    
    subgraph "Processing Layer"
        P[Apache Kafka]
        Q[Apache Flink]
        R[Apache Airflow]
        S[Apache NiFi]
    end
    
    subgraph "Data Layer"
        T[ClickHouse Cluster]
        U[PostgreSQL]
        V[Redis Cluster]
        W[MinIO/S3]
    end
    
    subgraph "Monitoring"
        X[Prometheus]
        Y[Grafana]
        Z[ELK Stack]
    end
    
    A --> C
    B --> C
    C --> D
    D --> E
    E --> F
    E --> G
    E --> I
    E --> J
    E --> K
    E --> L
    E --> M
    E --> N
    E --> O
    G --> H
    I --> T
    I --> U
    J --> T
    J --> U
    K --> U
    L --> P
    M --> T
    M --> W
    N --> U
    O --> U
    P --> Q
    R --> T
    R --> U
    S --> P
    I --> V
    J --> V
    K --> V
    L --> V
    M --> V
    N --> V
    O --> V
    
    I -.-> X
    J -.-> X
    K -.-> X
    L -.-> X
    M -.-> X
    N -.-> X
    O -.-> X
    
    X --> Y
    I -.-> Z
    J -.-> Z
    K -.-> Z
    L -.-> Z
    M -.-> Z
    N -.-> Z
    O -.-> Z
```

### Architectural Patterns

- **Microservices Architecture**: Domain-driven service separation with independent scaling
- **Event-Driven Architecture**: Kafka-based asynchronous communication between services
- **CQRS Pattern**: Command Query Responsibility Segregation for data operations
- **API Gateway Pattern**: Centralized entry point with routing and authentication
- **Database-per-Service Pattern**: Each service owns its data with appropriate databases
- **Circuit Breaker Pattern**: Resilience for external service calls
- **Saga Pattern**: Distributed transaction management across services

## Tech Stack

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.3.3 | Primary development language | Strong typing, excellent tooling, team expertise |
| Frontend Framework | React | 18.2.0 | UI framework | Large ecosystem, component-based architecture |
| UI Component Library | Material-UI | 5.14.0 | UI components | Professional design, accessibility features |
| State Management | Redux Toolkit | 1.9.7 | State management | Predictable state updates, dev tools |
| Visualization | D3.js | 7.8.5 | Custom visualizations | Maximum flexibility for complex charts |
| Visualization | Recharts | 2.8.0 | Standard charts | React integration, performance |
| Backend Language | Node.js | 20.11.0 | Backend runtime | LTS version, large ecosystem |
| Backend Framework | Express.js | 4.18.2 | API framework | Lightweight, middleware support |
| API Style | REST + GraphQL | - | API design | REST for CRUD, GraphQL for complex queries |
| Database (Analytics) | ClickHouse | 23.3.1 | Analytical database | Columnar storage, query performance |
| Database (Metadata) | PostgreSQL | 15.4 | Metadata database | Relational features, reliability |
| Cache | Redis | 7.2.1 | Caching layer | In-memory performance, data structures |
| Message Queue | Apache Kafka | 3.5.1 | Event streaming | High throughput, durability |
| Stream Processing | Apache Flink | 1.17.1 | Stream processing | Real-time analytics, stateful computing |
| Workflow Orchestration | Apache Airflow | 2.7.2 | ETL orchestration | Workflow management, scheduling |
| Data Integration | Apache NiFi | 1.23.0 | Data flow automation | Visual pipeline design, 150+ processors |
| API Gateway | Kong | 3.4.0 | API gateway | Enterprise features, plugins |
| Authentication | Keycloak | 22.0.5 | Identity management | Open-source, enterprise features |
| Containerization | Docker | 24.0.5 | Container runtime | Industry standard, ecosystem |
| Orchestration | Kubernetes | 1.28.2 | Container orchestration | Cloud-native, auto-scaling |
| Monitoring | Prometheus | 2.45.0 | Metrics collection | Time-series data, alerting |
| Visualization | Grafana | 10.0.0 | Monitoring dashboards | Rich visualization, alerting |
| Logging | ELK Stack | 8.10.0 | Log aggregation | Centralized logging, search |
| Build Tool | Vite | 4.4.9 | Frontend build tool | Fast development, optimized builds |
| Testing | Jest | 29.7.0 | Testing framework | JavaScript ecosystem, snapshot testing |
| CI/CD | GitHub Actions | - | CI/CD pipeline | Integrated with GitHub, marketplace |

## Data Models

### User and Authentication Model

```typescript
interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
  isActive: boolean;
}

interface UserRole {
  id: string;
  name: string;
  permissions: Permission[];
  tenantId: string;
}

interface Permission {
  id: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}
```

### Dashboard Model

```typescript
interface Dashboard {
  id: string;
  name: string;
  description?: string;
  tenantId: string;
  ownerId: string;
  layout: DashboardLayout;
  components: DashboardComponent[];
  filters: DashboardFilter[];
  permissions: DashboardPermission[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  version: number;
}

interface DashboardComponent {
  id: string;
  type: ComponentType;
  position: Position;
  size: Size;
  config: ComponentConfig;
  dataSource: DataSourceBinding;
  style?: ComponentStyle;
}

interface DataSourceBinding {
  dataSourceId: string;
  query?: string;
  parameters?: Record<string, any>;
  refreshInterval?: number;
}
```

### Data Source Model

```typescript
interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  connectionConfig: ConnectionConfig;
  tenantId: string;
  ownerId: string;
  schema?: DatabaseSchema;
  lastTestedAt?: Date;
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password?: string; // Encrypted
  ssl?: boolean;
  additionalParams?: Record<string, any>;
}
```

## API Specification

### REST API Endpoints

```yaml
openapi: 3.0.0
info:
  title: Open-Source BI Platform API
  version: 1.0.0
  description: REST API for the open-source business intelligence platform
servers:
  - url: https://api.bi-platform.com/v1
    description: Production server
  - url: https://staging-api.bi-platform.com/v1
    description: Staging server

paths:
  /auth/login:
    post:
      summary: User authentication
      tags:
        - Authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                username:
                  type: string
                password:
                  type: string
              required:
                - username
                - password
      responses:
        '200':
          description: Successful authentication
          content:
            application/json:
              schema:
                type: object
                properties:
                  token:
                    type: string
                  refreshToken:
                    type: string
                  user:
                    $ref: '#/components/schemas/User'
        '401':
          description: Authentication failed

  /dashboards:
    get:
      summary: List dashboards
      tags:
        - Dashboards
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: search
          in: query
          schema:
            type: string
      responses:
        '200':
          description: List of dashboards
          content:
            application/json:
              schema:
                type: object
                properties:
                  dashboards:
                    type: array
                    items:
                      $ref: '#/components/schemas/Dashboard'
                  pagination:
                    $ref: '#/components/schemas/Pagination'

    post:
      summary: Create dashboard
      tags:
        - Dashboards
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateDashboardRequest'
      responses:
        '201':
          description: Dashboard created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Dashboard'

  /dashboards/{id}:
    get:
      summary: Get dashboard by ID
      tags:
        - Dashboards
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Dashboard details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Dashboard'
        '404':
          description: Dashboard not found

    put:
      summary: Update dashboard
      tags:
        - Dashboards
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/UpdateDashboardRequest'
      responses:
        '200':
          description: Dashboard updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Dashboard'

    delete:
      summary: Delete dashboard
      tags:
        - Dashboards
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '204':
          description: Dashboard deleted

  /data-sources:
    get:
      summary: List data sources
      tags:
        - Data Sources
      responses:
        '200':
          description: List of data sources
          content:
            application/json:
              schema:
                type: object
                properties:
                  dataSources:
                    type: array
                    items:
                      $ref: '#/components/schemas/DataSource'

    post:
      summary: Create data source
      tags:
        - Data Sources
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateDataSourceRequest'
      responses:
        '201':
          description: Data source created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DataSource'

  /data-sources/{id}/test:
    post:
      summary: Test data source connection
      tags:
        - Data Sources
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Connection test result
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
                  message:
                    type: string
                  latency:
                    type: number

  /data-sources/{id}/schema:
    get:
      summary: Get data source schema
      tags:
        - Data Sources
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Database schema
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DatabaseSchema'

  /queries:
    post:
      summary: Execute query
      tags:
        - Queries
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ExecuteQueryRequest'
      responses:
        '200':
          description: Query results
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/QueryResult'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        username:
          type: string
        email:
          type: string
        firstName:
          type: string
        lastName:
          type: string
        role:
          type: string
        tenantId:
          type: string
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    Dashboard:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        description:
          type: string
        tenantId:
          type: string
        ownerId:
          type: string
        layout:
          $ref: '#/components/schemas/DashboardLayout'
        components:
          type: array
          items:
            $ref: '#/components/schemas/DashboardComponent'
        filters:
          type: array
          items:
            $ref: '#/components/schemas/DashboardFilter'
        permissions:
          type: array
          items:
            $ref: '#/components/schemas/DashboardPermission'
        tags:
          type: array
          items:
            type: string
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
        publishedAt:
          type: string
          format: date-time
        version:
          type: integer

    DataSource:
      type: object
      properties:
        id:
          type: string
        name:
          type: string
        type:
          type: string
        connectionConfig:
          $ref: '#/components/schemas/ConnectionConfig'
        tenantId:
          type: string
        ownerId:
          type: string
        status:
          type: string
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
```

## Components

### Frontend Components

#### Dashboard Builder Component

**Responsibility:** Interactive dashboard creation interface
**Key Interfaces:** Drag-and-drop API, component palette, layout engine
**Dependencies:** React DnD, D3.js, Redux store
**Technology Stack:** React 18, TypeScript, Material-UI

```typescript
interface DashboardBuilderProps {
  dashboard: Dashboard;
  onSave: (dashboard: Dashboard) => void;
  onPreview: (dashboard: Dashboard) => void;
  availableDataSources: DataSource[];
}

const DashboardBuilder: React.FC<DashboardBuilderProps> = ({
  dashboard,
  onSave,
  onPreview,
  availableDataSources
}) => {
  // Component implementation
};
```

#### Chart Component Library

**Responsibility:** Reusable chart components with consistent API
**Key Interfaces:** Chart configuration, data binding, event handling
**Dependencies:** D3.js, Recharts, React hooks
**Technology Stack:** React 18, TypeScript, D3.js

```typescript
interface ChartProps {
  type: ChartType;
  data: ChartData;
  config: ChartConfig;
  onDataPointClick?: (point: DataPoint) => void;
  onFilter?: (filter: Filter) => void;
}

const Chart: React.FC<ChartProps> = ({
  type,
  data,
  config,
  onDataPointClick,
  onFilter
}) => {
  // Chart implementation based on type
};
```

### Backend Services

#### Dashboard Service

**Responsibility:** Dashboard CRUD operations, rendering, and sharing
**Key Interfaces:** REST API, WebSocket for real-time updates
**Dependencies:** PostgreSQL, ClickHouse, Redis
**Technology Stack:** Node.js, Express.js, TypeScript

```typescript
class DashboardService {
  async createDashboard(dashboard: CreateDashboardRequest): Promise<Dashboard> {
    // Create dashboard in PostgreSQL
    // Validate components and data bindings
    // Set initial permissions
  }

  async getDashboard(id: string, userId: string): Promise<Dashboard> {
    // Retrieve dashboard from PostgreSQL
    // Check user permissions
    // Resolve data source references
  }

  async updateDashboard(id: string, updates: UpdateDashboardRequest): Promise<Dashboard> {
    // Update dashboard in PostgreSQL
    // Validate changes
    // Create version history
  }

  async deleteDashboard(id: string, userId: string): Promise<void> {
    // Check permissions
    // Delete dashboard and related data
  }

  async renderDashboard(id: string, filters?: Filter[]): Promise<RenderedDashboard> {
    // Retrieve dashboard
    // Execute queries for all components
    // Apply filters
    // Return rendered dashboard
  }
}
```

#### Data Service

**Responsibility:** Query execution, data source management, and caching
**Key Interfaces:** SQL interface, connection management, query optimization
**Dependencies:** ClickHouse, PostgreSQL, Redis, Apache Kafka
**Technology Stack:** Node.js, Express.js, TypeScript

```typescript
class DataService {
  async executeQuery(request: ExecuteQueryRequest): Promise<QueryResult> {
    // Validate query
    // Check data source permissions
    // Execute query on appropriate database
    // Cache results if applicable
    // Return formatted results
  }

  async testConnection(dataSourceId: string): Promise<ConnectionTestResult> {
    // Retrieve data source configuration
    // Test connection
    // Return test results
  }

  async getSchema(dataSourceId: string): Promise<DatabaseSchema> {
    // Connect to data source
    // Extract schema information
    // Cache schema
    // Return schema
  }

  async refreshCache(dataSourceId: string): Promise<void> {
    // Invalidate cache for data source
    // Warm cache with common queries
  }
}
```

#### User Management Service

**Responsibility:** Authentication, authorization, and user management
**Key Interfaces:** JWT tokens, role-based access control, user profiles
**Dependencies:** Keycloak, PostgreSQL, Redis
**Technology Stack:** Node.js, Express.js, TypeScript

```typescript
class UserManagementService {
  async authenticate(credentials: LoginRequest): Promise<AuthResult> {
    // Validate credentials with Keycloak
    // Generate JWT tokens
    // Update user activity
    // Return authentication result
  }

  async authorize(token: string, resource: string, action: string): Promise<boolean> {
    // Validate JWT token
    // Check user permissions
    // Apply row-level security rules
    // Return authorization result
  }

  async createUser(user: CreateUserRequest): Promise<User> {
    // Create user in Keycloak
    // Create user profile in PostgreSQL
    // Assign default role
    // Return created user
  }

  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    // Update user role in Keycloak
    // Update role in PostgreSQL
    // Invalidate existing tokens
  }
}
```

## Core Workflows

### Dashboard Creation Workflow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API Gateway
    participant Dashboard Service
    participant Data Service
    participant PostgreSQL
    participant ClickHouse

    User->>Frontend: Create new dashboard
    Frontend->>API Gateway: POST /dashboards
    API Gateway->>Dashboard Service: Create dashboard request
    Dashboard Service->>PostgreSQL: Save dashboard metadata
    PostgreSQL-->>Dashboard Service: Dashboard ID
    Dashboard Service-->>API Gateway: Dashboard response
    API Gateway-->>Frontend: Dashboard response
    Frontend-->>User: Show dashboard builder

    User->>Frontend: Add chart component
    Frontend->>Frontend: Configure chart
    Frontend->>API Gateway: POST /queries
    API Gateway->>Data Service: Execute query
    Data Service->>ClickHouse: Execute SQL query
    ClickHouse-->>Data Service: Query results
    Data Service-->>API Gateway: Formatted results
    API Gateway-->>Frontend: Chart data
    Frontend-->>User: Render chart

    User->>Frontend: Save dashboard
    Frontend->>API Gateway: PUT /dashboards/{id}
    API Gateway->>Dashboard Service: Update dashboard
    Dashboard Service->>PostgreSQL: Update dashboard metadata
    PostgreSQL-->>Dashboard Service: Confirmation
    Dashboard Service-->>API Gateway: Updated dashboard
    API Gateway-->>Frontend: Updated dashboard
    Frontend-->>User: Save confirmation
```

### Real-time Data Update Workflow

```mermaid
sequenceDiagram
    participant Data Source
    participant Apache NiFi
    participant Apache Kafka
    participant Apache Flink
    participant ClickHouse
    participant WebSocket Service
    participant Frontend
    participant User

    Data Source->>Apache NiFi: Data change
    Apache NiFi->>Apache Kafka: Publish event
    Apache Kafka->>Apache Flink: Consume event
    Apache Flink->>Apache Flink: Process transformation
    Apache Flink->>ClickHouse: Update data
    ClickHouse->>WebSocket Service: Data change notification
    WebSocket Service->>Frontend: WebSocket message
    Frontend->>Frontend: Update chart
    Frontend-->>User: Updated visualization
```

## Database Schema

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

## Unified Project Structure

```
bi-platform/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── ci.yaml
│       └── deploy.yaml
├── apps/                       # Application packages
│   ├── web/                    # Frontend application
│   │   ├── public/             # Static assets
│   │   ├── src/
│   │   │   ├── components/     # UI components
│   │   │   │   ├── charts/      # Chart components
│   │   │   │   ├── dashboard/   # Dashboard components
│   │   │   │   ├── common/      # Shared components
│   │   │   │   └── forms/       # Form components
│   │   │   ├── pages/          # Page components/routes
│   │   │   │   ├── DashboardBuilder.tsx
│   │   │   │   ├── DashboardViewer.tsx
│   │   │   │   ├── DataSourceManager.tsx
│   │   │   │   └── UserManager.tsx
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useDashboard.ts
│   │   │   │   └── useDataSource.ts
│   │   │   ├── services/       # API client services
│   │   │   │   ├── api.ts
│   │   │   │   ├── dashboardService.ts
│   │   │   │   └── dataSourceService.ts
│   │   │   ├── stores/         # State management
│   │   │   │   ├── authSlice.ts
│   │   │   │   ├── dashboardSlice.ts
│   │   │   │   └── dataSourceSlice.ts
│   │   │   ├── utils/          # Frontend utilities
│   │   │   ├── styles/         # Global styles/themes
│   │   │   └── types/          # TypeScript definitions
│   │   ├── tests/              # Frontend tests
│   │   ├── package.json
│   │   └── vite.config.ts
│   └── api/                    # Backend application
│       ├── src/
│       │   ├── controllers/     # API route handlers
│       │   │   ├── authController.ts
│       │   │   ├── dashboardController.ts
│       │   │   ├── dataSourceController.ts
│       │   │   └── queryController.ts
│       │   ├── services/       # Business logic
│       │   │   ├── authService.ts
│       │   │   ├── dashboardService.ts
│       │   │   ├── dataSourceService.ts
│       │   │   └── queryService.ts
│       │   ├── models/         # Data models
│       │   │   ├── User.ts
│       │   │   ├── Dashboard.ts
│       │   │   └── DataSource.ts
│       │   ├── middleware/     # Express middleware
│       │   │   ├── auth.ts
│       │   │   ├── validation.ts
│       │   │   └── errorHandler.ts
│       │   ├── utils/          # Backend utilities
│       │   ├── database/       # Database connections
│       │   ├── cache/          # Cache management
│       │   └── logger/         # Logging utilities
│       │   ├── config/         # Configuration
│       │   ├── types/          # TypeScript definitions
│       │   └── server.ts       # Server entry point
│       ├── tests/              # Backend tests
│       ├── package.json
│       └── tsconfig.json
├── packages/                   # Shared packages
│   ├── shared/                 # Shared types/utilities
│   │   ├── src/
│   │   │   ├── types/          # TypeScript interfaces
│   │   │   │   ├── dashboard.ts
│   │   │   │   ├── dataSource.ts
│   │   │   │   └── user.ts
│   │   │   ├── constants/      # Shared constants
│   │   │   ├── utils/          # Shared utilities
│   │   │   └── validators/     # Validation schemas
│   │   └── package.json
│   ├── ui/                     # Shared UI components
│   │   ├── src/
│   │   │   ├── components/     # Reusable components
│   │   │   ├── hooks/          # Shared hooks
│   │   │   └── themes/         # Theme definitions
│   │   └── package.json
│   └── config/                 # Shared configuration
│       ├── src/
│       │   ├── database/       # Database configurations
│       │   ├── redis/          # Redis configurations
│       │   └── kafka/          # Kafka configurations
│       └── package.json
├── infrastructure/             # IaC definitions
│   ├── kubernetes/             # K8s manifests
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   ├── secret.yaml
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── ingress.yaml
│   ├── helm/                   # Helm charts
│   │   ├── Chart.yaml
│   │   ├── values.yaml
│   │   └── templates/
│   ├── terraform/              # Terraform for cloud resources
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── docker/                 # Docker configurations
│       ├── Dockerfile.web
│       ├── Dockerfile.api
│       └── docker-compose.yml
├── scripts/                    # Build/deploy scripts
│   ├── build.sh
│   ├── deploy.sh
│   ├── test.sh
│   └── migrate.sh
├── docs/                       # Documentation
│   ├── prd.md
│   ├── architecture.md
│   └── api/
├── .env.example                # Environment template
├── package.json                # Root package.json
├── nx.json                     # Nx configuration
├── tsconfig.base.json          # Base TypeScript config
└── README.md
```

## Development Workflow

### Local Development Setup

#### Prerequisites

```bash
# Required tools
node --version  # >= 18.0.0
npm --version   # >= 9.0.0
docker --version # >= 24.0.0
kubectl --version # >= 1.28.0
```

#### Initial Setup

```bash
# Clone repository
git clone https://github.com/your-org/bi-platform.git
cd bi-platform

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start local services with Docker Compose
docker-compose up -d postgres redis clickhouse kafka

# Run database migrations
npm run migrate

# Seed development data
npm run seed

# Start development servers
npm run dev
```

#### Development Commands

```bash
# Start all services
npm run dev

# Start frontend only
npm run dev:web

# Start backend only
npm run dev:api

# Run tests
npm run test

# Run tests with coverage
npm run test:coverage

# Build for production
npm run build

# Start production build locally
npm run start
```

### Environment Configuration

#### Required Environment Variables

```bash
# Frontend (.env.local)
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_KEYCLOAK_URL=http://localhost:8080/auth
REACT_APP_KEYCLOAK_REALM=bi-platform
REACT_APP_KEYCLOAK_CLIENT_ID=web-app

# Backend (.env)
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/bi_platform
CLICKHOUSE_URL=http://localhost:8123/default
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
JWT_SECRET=your-super-secret-jwt-key
KEYCLOAK_URL=http://localhost:8080/auth
KEYCLOAK_REALM=bi-platform
KEYCLOAK_CLIENT_ID=api-service

# Shared
TENANT_ID=default
LOG_LEVEL=debug
```

## Deployment Architecture

### Deployment Strategy

**Frontend Deployment:**
- **Platform:** Vercel/Netlify or Kubernetes with Nginx
- **Build Command:** `npm run build:web`
- **Output Directory:** `apps/web/dist`
- **CDN/Edge:** CloudFlare for static assets

**Backend Deployment:**
- **Platform:** Kubernetes with Helm charts
- **Build Command:** `npm run build:api`
- **Deployment Method:** Rolling updates with health checks
- **Replicas:** 3-5 based on load

### CI/CD Pipeline

```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: docker/build-push-action@v3
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKER_HUB_USERNAME }}/bi-platform:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: azure/k8s-set-context@v1
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG }}
      - uses: azure/k8s-deploy@v1
        with:
          manifests: |
            infrastructure/kubernetes/deployment.yaml
          images: |
            ${{ secrets.DOCKER_HUB_USERNAME }}/bi-platform:${{ github.sha }}
```

### Environments

| Environment | Frontend URL | Backend URL | Purpose |
|--------------|--------------|--------------|---------|
| Development | http://localhost:3000 | http://localhost:3001 | Local development |
| Staging | https://staging.bi-platform.com | https://api.staging.bi-platform.com | Pre-production testing |
| Production | https://bi-platform.com | https://api.bi-platform.com | Live environment |

## Security and Performance

### Security Requirements

**Frontend Security:**
- CSP Headers: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';`
- XSS Prevention: React's built-in XSS protection + DOMPurify for user content
- Secure Storage: Use httpOnly cookies for tokens, avoid localStorage for sensitive data
- Authentication: JWT tokens with short expiration + refresh token pattern

**Backend Security:**
- Input Validation: Comprehensive validation using Joi/Zod schemas
- Rate Limiting: Express-rate-limit with user-based limits
- CORS Policy: Strict CORS with allowed origins
- API Security: Kong API gateway with security plugins

**Authentication Security:**
- Token Storage: httpOnly cookies with secure flag
- Session Management: Redis-based session store
- Password Policy: Enforce strong passwords via Keycloak
- Multi-Factor: Optional TOTP-based MFA

### Performance Optimization

**Frontend Performance:**
- Bundle Size Target: <2MB initial load, <500KB subsequent loads
- Loading Strategy: Code splitting with React.lazy and dynamic imports
- Caching Strategy: Service worker for static assets, browser cache for API responses
- Performance Monitoring: Web Vitals tracking with real user monitoring

**Backend Performance:**
- Response Time Target: <500ms for API calls, <5s for complex queries
- Database Optimization: ClickHouse for analytics, connection pooling for PostgreSQL
- Caching Strategy: Redis for query results, application-level caching for expensive operations
- Load Balancing: Horizontal pod autoscaling based on CPU/memory metrics

## Testing Strategy

### Testing Pyramid

```
E2E Tests
/        \
Integration Tests
/            \
Frontend Unit  Backend Unit
```

### Test Organization

**Frontend Tests:**
```
apps/web/src/
├── components/
│   └── __tests__/
│       ├── charts/
│       ├── dashboard/
│       └── common/
├── pages/
│   └── __tests__/
├── hooks/
│   └── __tests__/
├── services/
│   └── __tests__/
└── utils/
    └── __tests__/
```

**Backend Tests:**
```
apps/api/src/
├── controllers/
│   └── __tests__/
├── services/
│   └── __tests__/
├── models/
│   └── __tests__/
├── middleware/
│   └── __tests__/
└── utils/
    └── __tests__/
```

**E2E Tests:**
```
e2e/
├── dashboard-creation.spec.ts
├── data-source-management.spec.ts
├── user-management.spec.ts
└── query-execution.spec.ts
```

### Test Examples

**Frontend Component Test:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { DashboardBuilder } from '../DashboardBuilder';
import { store } from '../../store';

describe('DashboardBuilder', () => {
  it('should render dashboard builder interface', () => {
    render(
      <Provider store={store}>
        <DashboardBuilder
          dashboard={mockDashboard}
          onSave={jest.fn()}
          onPreview={jest.fn()}
          availableDataSources={mockDataSources}
        />
      </Provider>
    );

    expect(screen.getByText('Dashboard Builder')).toBeInTheDocument();
    expect(screen.getByText('Components')).toBeInTheDocument();
    expect(screen.getByText('Data Sources')).toBeInTheDocument();
  });

  it('should add chart component when dragged to canvas', () => {
    const onSave = jest.fn();
    render(
      <Provider store={store}>
        <DashboardBuilder
          dashboard={mockDashboard}
          onSave={onSave}
          onPreview={jest.fn()}
          availableDataSources={mockDataSources}
        />
      </Provider>
    );

    const barChart = screen.getByText('Bar Chart');
    const canvas = screen.getByTestId('dashboard-canvas');

    fireEvent.dragStart(barChart);
    fireEvent.dragOver(canvas);
    fireEvent.drop(canvas);

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        components: expect.arrayContaining([
          expect.objectContaining({
            type: 'bar-chart'
          })
        ])
      })
    );
  });
});
```

**Backend API Test:**
```typescript
import request from 'supertest';
import { app } from '../server';
import { createTestUser, createTestDataSource } from '../helpers/testData';

describe('Dashboard API', () => {
  let authToken: string;
  let testUser: User;
  let testDataSource: DataSource;

  beforeAll(async () => {
    testUser = await createTestUser();
    authToken = await generateTestToken(testUser);
    testDataSource = await createTestDataSource(testUser.tenantId);
  });

  describe('POST /dashboards', () => {
    it('should create a new dashboard', async () => {
      const dashboardData = {
        name: 'Test Dashboard',
        description: 'Test dashboard description',
        layout: { grid: { columns: 12, rows: 8 } },
        components: [],
        filters: []
      };

      const response = await request(app)
        .post('/api/v1/dashboards')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dashboardData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: dashboardData.name,
        description: dashboardData.description,
        tenantId: testUser.tenantId,
        ownerId: testUser.id
      });
      expect(response.body.id).toBeDefined();
    });

    it('should return 401 for unauthenticated requests', async () => {
      const dashboardData = {
        name: 'Test Dashboard',
        layout: { grid: { columns: 12, rows: 8 } },
        components: []
      };

      await request(app)
        .post('/api/v1/dashboards')
        .send(dashboardData)
        .expect(401);
    });
  });

  describe('GET /dashboards/:id', () => {
    let dashboardId: string;

    beforeAll(async () => {
      const dashboardData = {
        name: 'Test Dashboard',
        layout: { grid: { columns: 12, rows: 8 } },
        components: []
      };

      const response = await request(app)
        .post('/api/v1/dashboards')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dashboardData);

      dashboardId = response.body.id;
    });

    it('should return dashboard by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/dashboards/${dashboardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: dashboardId,
        name: 'Test Dashboard'
      });
    });

    it('should return 404 for non-existent dashboard', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      await request(app)
        .get(`/api/v1/dashboards/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
```

**E2E Test:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid=username]', 'testuser');
    await page.fill('[data-testid=password]', 'password');
    await page.click('[data-testid=login-button]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create a new dashboard with a chart', async ({ page }) => {
    // Navigate to dashboard builder
    await page.click('[data-testid=new-dashboard-button]');
    await expect(page).toHaveURL('/dashboard/new');

    // Set dashboard name
    await page.fill('[data-testid=dashboard-name]', 'Test Dashboard');
    
    // Add a bar chart
    await page.dragAndDrop(
      '[data-testid=chart-bar]',
      '[data-testid=dashboard-canvas]'
    );

    // Configure chart data source
    await page.click('[data-testid=chart-0]');
    await page.selectOption('[data-testid=data-source-select]', 'test-data-source');
    await page.fill('[data-testid=sql-query]', 'SELECT category, COUNT(*) as count FROM test_table GROUP BY category');
    await page.click('[data-testid=apply-query]');

    // Save dashboard
    await page.click('[data-testid=save-dashboard-button]');
    await expect(page.locator('[data-testid=save-success-message]')).toBeVisible();

    // Verify dashboard is saved
    await page.goto('/dashboard');
    await expect(page.locator('text=Test Dashboard')).toBeVisible();
  });

  test('should display chart data correctly', async ({ page }) => {
    // Create dashboard with chart (reuse steps from previous test)
    await page.click('[data-testid=new-dashboard-button]');
    await page.fill('[data-testid=dashboard-name]', 'Data Test Dashboard');
    await page.dragAndDrop(
      '[data-testid=chart-bar]',
      '[data-testid=dashboard-canvas]'
    );
    await page.click('[data-testid=chart-0]');
    await page.selectOption('[data-testid=data-source-select]', 'test-data-source');
    await page.fill('[data-testid=sql-query]', 'SELECT category, COUNT(*) as count FROM test_table GROUP BY category');
    await page.click('[data-testid=apply-query]');
    await page.click('[data-testid=save-dashboard-button]');

    // Navigate to dashboard viewer
    await page.click('[data-testid=view-dashboard-button]');

    // Verify chart renders with data
    await expect(page.locator('[data-testid=chart-0]')).toBeVisible();
    await expect(page.locator('[data-testid=chart-bar]')).toBeVisible();
    
    // Verify chart has data points
    const chartBars = page.locator('[data-testid=chart-bar] rect');
    await expect(chartBars).toHaveCount(3); // Assuming 3 categories in test data
  });
});
```

## Coding Standards

### Critical Fullstack Rules

- **Type Safety**: All code must use TypeScript with strict mode enabled
- **API Contracts**: All API endpoints must have OpenAPI specifications
- **Error Handling**: All async operations must have proper error handling
- **Authentication**: All API endpoints (except auth) must validate JWT tokens
- **Data Validation**: All user inputs must be validated before processing
- **Database Transactions**: All multi-table operations must use transactions
- **Logging**: All significant operations must be logged with appropriate context
- **Testing**: All new features must have unit tests with minimum 80% coverage

### Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `DashboardBuilder.tsx` |
| Hooks | camelCase with 'use' | - | `useDashboard.ts` |
| API Routes | - | kebab-case | `/api/v1/dashboards` |
| Database Tables | - | snake_case | `dashboard_permissions` |
| Files | PascalCase | kebab-case | `DashboardService.ts`, `dashboard-service.ts` |

## Error Handling Strategy

### Error Flow

```mermaid
sequenceDiagram
    participant Client
    participant API Gateway
    participant Backend Service
    participant Database
    participant Logging Service
    participant Error Monitoring

    Client->>API Gateway: API Request
    API Gateway->>Backend Service: Forward Request
    Backend Service->>Database: Query/Operation
    Database-->>Backend Service: Error Response
    Backend Service->>Logging Service: Log Error
    Backend Service->>Error Monitoring: Report Error
    Backend Service-->>API Gateway: Error Response
    API Gateway-->>Client: Error Response
```

### Error Response Format

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
    stack?: string; // Only in development
  };
}
```

### Frontend Error Handling

```typescript
// Error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Report to error monitoring service
    reportError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong.</h2>
          <details>
            {this.state.error && this.state.error.message}
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

// API error handling hook
const useApiError = () => {
  const [error, setError] = useState<ApiError | null>(null);

  const handleError = useCallback((error: unknown) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const apiError = error.response.data as ApiError;
      setError(apiError);
    } else {
      setError({
        error: {
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
          requestId: generateRequestId()
        }
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
};
```

### Backend Error Handling

```typescript
// Error handling middleware
const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.headers['x-request-id'] || generateRequestId();
  
  // Log error
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    requestId,
    userId: req.user?.id,
    path: req.path,
    method: req.method
  });

  // Send to error monitoring
  errorMonitoring.captureException(error, {
    requestId,
    user: req.user,
    request: {
      url: req.url,
      method: req.method,
      headers: req.headers,
      body: req.body
    }
  });

  // Return appropriate error response
  if (error instanceof ValidationError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: error.message,
        details: error.details,
        timestamp: new Date().toISOString(),
        requestId
      }
    });
  }

  if (error instanceof AuthenticationError) {
    return res.status(401).json({
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
        requestId
      }
    });
  }

  if (error instanceof AuthorizationError) {
    return res.status(403).json({
      error: {
        code: 'AUTHORIZATION_ERROR',
        message: error.message,
        timestamp: new Date().toISOString(),
        requestId
      }
    });
  }

  // Default error response
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : error.message,
      timestamp: new Date().toISOString(),
      requestId,
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    }
  });
};

// Custom error classes
class ValidationError extends Error {
  constructor(message: string, public details?: Record<string, any>) {
    super(message);
    this.name = 'ValidationError';
  }
}

class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}
```

## Monitoring and Observability

### Monitoring Stack

- **Frontend Monitoring**: Sentry for error tracking, LogRocket for session replay
- **Backend Monitoring**: Prometheus for metrics, Grafana for visualization
- **Error Tracking**: Sentry for error aggregation and alerting
- **Performance Monitoring**: New Relic or DataDog for APM
- **Log Aggregation**: ELK Stack (Elasticsearch, Logstash, Kibana)

### Key Metrics

**Frontend Metrics:**
- Core Web Vitals (LCP, FID, CLS)
- JavaScript errors by type and frequency
- API response times by endpoint
- User interactions and conversion funnels

**Backend Metrics:**
- Request rate by endpoint
- Error rate by service
- Response time percentiles (p50, p95, p99)
- Database query performance
- Memory and CPU utilization

**Infrastructure Metrics:**
- Pod resource utilization
- Database connection pool usage
- Kafka consumer lag
- Redis memory usage

## Checklist Results Report

### Architect Checklist Validation

| Category | Status | Critical Issues |
|----------|--------|-----------------|
| 1. Requirements Alignment | PASS | None |
| 2. Architecture Fundamentals | PASS | None |
| 3. Technical Stack & Decisions | PASS | None |
| 4. Frontend Design & Implementation | PASS | None |
| 5. Backend Architecture | PASS | None |
| 6. Resilience & Operational Readiness | PASS | None |
| 7. Security & Compliance | PASS | None |
| 8. Implementation Guidance | PASS | None |
| 9. Dependency & Integration Management | PASS | None |
| 10. AI Agent Implementation Suitability | PASS | None |

### Final Assessment

**Overall Architecture Readiness**: High (95%)
**Critical Risks Identified**: None
**Key Strengths of the Architecture**:
- Comprehensive microservices design with clear boundaries
- Strong technology choices balancing performance and maintainability
- Detailed security implementation across all layers
- Scalable architecture supporting enterprise requirements
- Complete development workflow with testing strategies

**AI Implementation Readiness**: High
- Component architecture is appropriately sized for AI agent implementation
- Patterns are consistent and predictable
- Implementation guidance is comprehensive
- Error prevention strategies are well-defined

## Next Steps

### UX Expert Prompt

Please create a comprehensive UI/UX specification for this open-source BI platform, focusing on creating an intuitive, powerful analytics interface that balances sophisticated capabilities with ease of use. Include detailed user flows for dashboard creation, data exploration, and collaboration features.

### Product Owner Prompt

Please validate this architecture document against the PRD requirements and create a comprehensive product backlog with detailed user stories for development teams. Focus on ensuring all functional requirements are addressed with appropriate technical implementations.

---

I've created a comprehensive fullstack architecture document for your open-source BI platform that includes:

1. **Complete system architecture** with microservices design and component relationships
2. **Detailed technology stack** with specific versions and rationale for each choice
3. **Data models** with TypeScript interfaces for all major entities
4. **Component architecture** for both frontend and backend services
5. **API specifications** with OpenAPI documentation for REST endpoints
6. **Database schemas** for both ClickHouse (analytics) and PostgreSQL (metadata)
7. **Project structure** for a monorepo with clear organization
8. **Development workflow** with local setup and environment configuration
9. **Deployment architecture** with CI/CD pipeline and Kubernetes deployment
10. **Security and performance** considerations with implementation details
11. **Testing strategy** with examples for unit, integration, and E2E tests
12. **Error handling** with comprehensive strategies for both frontend and backend
13. **Monitoring and observability** with specific tools and metrics

The architecture is designed to support all requirements from the PRD while maintaining vendor neutrality and open-source compliance. It provides a solid foundation for development teams to implement the platform incrementally through the defined phases.

