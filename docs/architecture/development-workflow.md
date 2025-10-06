# Development Workflow

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

