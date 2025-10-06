# BI Platform - Open-Source Business Intelligence Platform

A comprehensive, enterprise-grade Business Intelligence platform built with modern open-source technologies.

## Features

- 🔐 Secure authentication with JWT and Keycloak
- 📊 Interactive dashboards with real-time updates
- 🎨 Modern UI with Material-UI
- 🚀 High-performance analytics with ClickHouse
- 🐳 Docker containerization for easy deployment
- 🔄 Microservices architecture
- 📱 Responsive design

## Tech Stack

### Frontend
- React 18.2.0
- TypeScript 5.3.3
- Material-UI 5.14.0
- Redux Toolkit 1.9.7
- Vite 4.4.9

### Backend
- Node.js 20.11.0
- Express.js 4.18.2
- PostgreSQL 15.4
- Redis 7.2.1
- Keycloak 22.0.5

## Prerequisites

- Node.js >= 20.11.0
- npm >= 9.0.0
- Docker >= 24.0.0
- Docker Compose

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/Kirachon/Visualization.git
cd Visualization
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

### 4. Start services with Docker Compose (Development)

```bash
# Start only databases and services (for local development)
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be healthy
docker-compose -f docker-compose.dev.yml ps
```

### 5. Run database migrations

```bash
npm run migrate
```

### 6. Seed development data

```bash
npm run seed
```

This will create:
- Default tenant
- Admin role and Viewer role
- Admin user (username: `admin`, password: `admin123`)
- Viewer user (username: `viewer`, password: `viewer123`)

### 7. Start development servers

```bash
# Start both frontend and backend
npm run dev

# Or start them separately
npm run dev:web    # Frontend on http://localhost:3000
npm run dev:api    # Backend on http://localhost:3001
```

### 8. Access the application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/v1
- Keycloak Admin: http://localhost:8080 (admin/admin)

## Production Deployment

### Build and run with Docker Compose

```bash
# Build and start all services
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# View logs
docker-compose -f infrastructure/docker/docker-compose.yml logs -f

# Stop services
docker-compose -f infrastructure/docker/docker-compose.yml down
```

## Development

### Project Structure

```
bi-platform/
├── apps/
│   ├── web/                 # Frontend React application
│   └── api/                 # Backend Node.js API
├── packages/
│   ├── shared/              # Shared types and utilities
│   ├── ui/                  # Shared UI components
│   └── config/              # Shared configuration
├── infrastructure/
│   ├── docker/              # Docker configurations
│   └── kubernetes/          # Kubernetes manifests
├── scripts/                 # Build and deployment scripts
└── docs/                    # Documentation
```

### Available Scripts

```bash
# Development
npm run dev              # Start all services
npm run dev:web          # Start frontend only
npm run dev:api          # Start backend only

# Building
npm run build            # Build all packages
npm run build:web        # Build frontend
npm run build:api        # Build backend

# Testing
npm run test             # Run all tests
npm run test:coverage    # Run tests with coverage

# Database
npm run migrate          # Run database migrations
npm run seed             # Seed development data

# Linting
npm run lint             # Lint all packages
```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test -- --watch
```

## API Documentation

API documentation is available at:
- Development: http://localhost:3001/api/v1
- Health check: http://localhost:3001/api/v1/health

### Authentication Endpoints

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user

## Environment Variables

### Frontend (.env.local)
```
VITE_API_URL=http://localhost:3001/api/v1
```

### Backend (.env)
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/bi_platform
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
KEYCLOAK_URL=http://localhost:8080/auth
KEYCLOAK_REALM=bi-platform
KEYCLOAK_CLIENT_ID=api-service
TENANT_ID=default
LOG_LEVEL=debug
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@biplatform.local or open an issue on GitHub.

