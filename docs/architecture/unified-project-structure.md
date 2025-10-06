# Unified Project Structure

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

