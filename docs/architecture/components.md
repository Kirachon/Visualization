# Components

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

