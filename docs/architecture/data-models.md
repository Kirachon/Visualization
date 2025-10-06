# Data Models

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

