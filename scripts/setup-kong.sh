#!/bin/bash

# Kong Admin API URL
KONG_ADMIN_URL="http://localhost:8001"

echo "Setting up Kong API Gateway..."

# Wait for Kong to be ready
echo "Waiting for Kong to be ready..."
until curl -s "${KONG_ADMIN_URL}" > /dev/null; do
  echo "Kong is unavailable - sleeping"
  sleep 2
done
echo "Kong is ready!"

# Create API service
echo "Creating API service..."
curl -i -X POST "${KONG_ADMIN_URL}/services" \
  --data "name=bi-platform-api" \
  --data "url=http://api:3001"

# Create API route
echo "Creating API route..."
curl -i -X POST "${KONG_ADMIN_URL}/services/bi-platform-api/routes" \
  --data "name=api-route" \
  --data "paths[]=/api" \
  --data "strip_path=false"

# Add CORS plugin
echo "Adding CORS plugin..."
curl -i -X POST "${KONG_ADMIN_URL}/services/bi-platform-api/plugins" \
  --data "name=cors" \
  --data "config.origins=http://localhost:3000" \
  --data "config.origins=https://bi-platform.com" \
  --data "config.methods=GET" \
  --data "config.methods=POST" \
  --data "config.methods=PUT" \
  --data "config.methods=DELETE" \
  --data "config.methods=PATCH" \
  --data "config.methods=OPTIONS" \
  --data "config.credentials=true" \
  --data "config.max_age=3600"

# Add rate limiting plugin
echo "Adding rate limiting plugin..."
curl -i -X POST "${KONG_ADMIN_URL}/services/bi-platform-api/plugins" \
  --data "name=rate-limiting" \
  --data "config.minute=100" \
  --data "config.hour=1000" \
  --data "config.policy=local"

# Add request size limiting plugin
echo "Adding request size limiting plugin..."
curl -i -X POST "${KONG_ADMIN_URL}/services/bi-platform-api/plugins" \
  --data "name=request-size-limiting" \
  --data "config.allowed_payload_size=10"

# Create Web service
echo "Creating Web service..."
curl -i -X POST "${KONG_ADMIN_URL}/services" \
  --data "name=bi-platform-web" \
  --data "url=http://web:80"

# Create Web route
echo "Creating Web route..."
curl -i -X POST "${KONG_ADMIN_URL}/services/bi-platform-web/routes" \
  --data "name=web-route" \
  --data "paths[]=/web" \
  --data "strip_path=true"

echo "Kong setup complete!"
echo "Kong Proxy: http://localhost:8000"
echo "Kong Admin API: http://localhost:8001"
echo "Kong Admin GUI: http://localhost:8002"

