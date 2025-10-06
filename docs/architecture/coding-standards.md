# Coding Standards

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

