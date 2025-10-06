#!/bin/bash

echo "Starting Integration Tests..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
  exit 1
fi

echo "✅ Docker is running"

# Start services
echo "Starting services with docker-compose..."
docker-compose -f docker-compose.dev.yml up -d

# Wait for services to be healthy
echo "Waiting for services to be ready..."
sleep 10

# Check PostgreSQL
echo "Checking PostgreSQL..."
docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U postgres
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
else
  echo -e "${RED}❌ PostgreSQL is not ready${NC}"
  exit 1
fi

# Check Redis
echo "Checking Redis..."
docker-compose -f docker-compose.dev.yml exec -T redis redis-cli ping
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Redis is ready${NC}"
else
  echo -e "${RED}❌ Redis is not ready${NC}"
  exit 1
fi

# Run migrations
echo "Running database migrations..."
npm run migrate
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Migrations completed${NC}"
else
  echo -e "${RED}❌ Migrations failed${NC}"
  exit 1
fi

# Seed database
echo "Seeding database..."
npm run seed
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Database seeded${NC}"
else
  echo -e "${RED}❌ Seeding failed${NC}"
  exit 1
fi

# Run backend tests
echo "Running backend tests..."
cd apps/api && npm test
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Backend tests passed${NC}"
else
  echo -e "${RED}❌ Backend tests failed${NC}"
  exit 1
fi

# Run frontend tests
echo "Running frontend tests..."
cd ../web && npm test
if [ $? -eq 0 ]; then
  echo -e "${GREEN}✅ Frontend tests passed${NC}"
else
  echo -e "${RED}❌ Frontend tests failed${NC}"
  exit 1
fi

echo -e "${GREEN}✅ All integration tests passed!${NC}"

# Cleanup
echo "Cleaning up..."
docker-compose -f docker-compose.dev.yml down

echo "Integration tests complete!"

