#!/bin/bash

# Create certs directory if it doesn't exist
mkdir -p infrastructure/certs

echo "Generating self-signed SSL certificates for local development..."

# Generate private key
openssl genrsa -out infrastructure/certs/server.key 2048

# Generate certificate signing request
openssl req -new -key infrastructure/certs/server.key \
  -out infrastructure/certs/server.csr \
  -subj "/C=US/ST=State/L=City/O=BI Platform/OU=Development/CN=localhost"

# Generate self-signed certificate (valid for 365 days)
openssl x509 -req -days 365 \
  -in infrastructure/certs/server.csr \
  -signkey infrastructure/certs/server.key \
  -out infrastructure/certs/server.crt

# Generate DH parameters for stronger security
openssl dhparam -out infrastructure/certs/dhparam.pem 2048

echo "✅ SSL certificates generated successfully!"
echo "   Certificate: infrastructure/certs/server.crt"
echo "   Private Key: infrastructure/certs/server.key"
echo "   DH Params: infrastructure/certs/dhparam.pem"
echo ""
echo "⚠️  These are self-signed certificates for development only."
echo "   For production, use certificates from a trusted CA."

