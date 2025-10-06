#!/bin/bash

# Kong Admin API URL
KONG_ADMIN_URL="http://localhost:8001"

echo "Setting up Kong SSL certificates..."

# Wait for Kong to be ready
echo "Waiting for Kong to be ready..."
until curl -s "${KONG_ADMIN_URL}" > /dev/null; do
  echo "Kong is unavailable - sleeping"
  sleep 2
done
echo "Kong is ready!"

# Read certificate and key
CERT=$(cat infrastructure/certs/server.crt)
KEY=$(cat infrastructure/certs/server.key)

# Create certificate in Kong
echo "Creating SSL certificate in Kong..."
curl -i -X POST "${KONG_ADMIN_URL}/certificates" \
  --form "cert=${CERT}" \
  --form "key=${KEY}" \
  --form "snis=localhost"

# Update routes to use HTTPS
echo "Updating routes to support HTTPS..."
curl -i -X PATCH "${KONG_ADMIN_URL}/routes/api-route" \
  --data "protocols[]=https" \
  --data "protocols[]=http"

curl -i -X PATCH "${KONG_ADMIN_URL}/routes/web-route" \
  --data "protocols[]=https" \
  --data "protocols[]=http"

echo "Kong SSL setup complete!"
echo "HTTPS Proxy: https://localhost:8443"

