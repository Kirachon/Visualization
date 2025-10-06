# Deployment Architecture

### Deployment Strategy

**Frontend Deployment:**
- **Platform:** Vercel/Netlify or Kubernetes with Nginx
- **Build Command:** `npm run build:web`
- **Output Directory:** `apps/web/dist`
- **CDN/Edge:** CloudFlare for static assets

**Backend Deployment:**
- **Platform:** Kubernetes with Helm charts
- **Build Command:** `npm run build:api`
- **Deployment Method:** Rolling updates with health checks
- **Replicas:** 3-5 based on load

### CI/CD Pipeline

```yaml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run test
      - run: npm run test:e2e

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: docker/build-push-action@v3
        with:
          context: .
          push: true
          tags: ${{ secrets.DOCKER_HUB_USERNAME }}/bi-platform:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: azure/k8s-set-context@v1
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG }}
      - uses: azure/k8s-deploy@v1
        with:
          manifests: |
            infrastructure/kubernetes/deployment.yaml
          images: |
            ${{ secrets.DOCKER_HUB_USERNAME }}/bi-platform:${{ github.sha }}
```

### Environments

| Environment | Frontend URL | Backend URL | Purpose |
|--------------|--------------|--------------|---------|
| Development | http://localhost:3000 | http://localhost:3001 | Local development |
| Staging | https://staging.bi-platform.com | https://api.staging.bi-platform.com | Pre-production testing |
| Production | https://bi-platform.com | https://api.bi-platform.com | Live environment |

