# Testing Strategy

### Testing Pyramid

```
E2E Tests
/        \
Integration Tests
/            \
Frontend Unit  Backend Unit
```

### Test Organization

**Frontend Tests:**
```
apps/web/src/
├── components/
│   └── __tests__/
│       ├── charts/
│       ├── dashboard/
│       └── common/
├── pages/
│   └── __tests__/
├── hooks/
│   └── __tests__/
├── services/
│   └── __tests__/
└── utils/
    └── __tests__/
```

**Backend Tests:**
```
apps/api/src/
├── controllers/
│   └── __tests__/
├── services/
│   └── __tests__/
├── models/
│   └── __tests__/
├── middleware/
│   └── __tests__/
└── utils/
    └── __tests__/
```

**E2E Tests:**
```
e2e/
├── dashboard-creation.spec.ts
├── data-source-management.spec.ts
├── user-management.spec.ts
└── query-execution.spec.ts
```

### Test Examples

**Frontend Component Test:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { DashboardBuilder } from '../DashboardBuilder';
import { store } from '../../store';

describe('DashboardBuilder', () => {
  it('should render dashboard builder interface', () => {
    render(
      <Provider store={store}>
        <DashboardBuilder
          dashboard={mockDashboard}
          onSave={jest.fn()}
          onPreview={jest.fn()}
          availableDataSources={mockDataSources}
        />
      </Provider>
    );

    expect(screen.getByText('Dashboard Builder')).toBeInTheDocument();
    expect(screen.getByText('Components')).toBeInTheDocument();
    expect(screen.getByText('Data Sources')).toBeInTheDocument();
  });

  it('should add chart component when dragged to canvas', () => {
    const onSave = jest.fn();
    render(
      <Provider store={store}>
        <DashboardBuilder
          dashboard={mockDashboard}
          onSave={onSave}
          onPreview={jest.fn()}
          availableDataSources={mockDataSources}
        />
      </Provider>
    );

    const barChart = screen.getByText('Bar Chart');
    const canvas = screen.getByTestId('dashboard-canvas');

    fireEvent.dragStart(barChart);
    fireEvent.dragOver(canvas);
    fireEvent.drop(canvas);

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        components: expect.arrayContaining([
          expect.objectContaining({
            type: 'bar-chart'
          })
        ])
      })
    );
  });
});
```

**Backend API Test:**
```typescript
import request from 'supertest';
import { app } from '../server';
import { createTestUser, createTestDataSource } from '../helpers/testData';

describe('Dashboard API', () => {
  let authToken: string;
  let testUser: User;
  let testDataSource: DataSource;

  beforeAll(async () => {
    testUser = await createTestUser();
    authToken = await generateTestToken(testUser);
    testDataSource = await createTestDataSource(testUser.tenantId);
  });

  describe('POST /dashboards', () => {
    it('should create a new dashboard', async () => {
      const dashboardData = {
        name: 'Test Dashboard',
        description: 'Test dashboard description',
        layout: { grid: { columns: 12, rows: 8 } },
        components: [],
        filters: []
      };

      const response = await request(app)
        .post('/api/v1/dashboards')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dashboardData)
        .expect(201);

      expect(response.body).toMatchObject({
        name: dashboardData.name,
        description: dashboardData.description,
        tenantId: testUser.tenantId,
        ownerId: testUser.id
      });
      expect(response.body.id).toBeDefined();
    });

    it('should return 401 for unauthenticated requests', async () => {
      const dashboardData = {
        name: 'Test Dashboard',
        layout: { grid: { columns: 12, rows: 8 } },
        components: []
      };

      await request(app)
        .post('/api/v1/dashboards')
        .send(dashboardData)
        .expect(401);
    });
  });

  describe('GET /dashboards/:id', () => {
    let dashboardId: string;

    beforeAll(async () => {
      const dashboardData = {
        name: 'Test Dashboard',
        layout: { grid: { columns: 12, rows: 8 } },
        components: []
      };

      const response = await request(app)
        .post('/api/v1/dashboards')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dashboardData);

      dashboardId = response.body.id;
    });

    it('should return dashboard by ID', async () => {
      const response = await request(app)
        .get(`/api/v1/dashboards/${dashboardId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        id: dashboardId,
        name: 'Test Dashboard'
      });
    });

    it('should return 404 for non-existent dashboard', async () => {
      const fakeId = '550e8400-e29b-41d4-a716-446655440000';
      
      await request(app)
        .get(`/api/v1/dashboards/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
```

**E2E Test:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Dashboard Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('[data-testid=username]', 'testuser');
    await page.fill('[data-testid=password]', 'password');
    await page.click('[data-testid=login-button]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create a new dashboard with a chart', async ({ page }) => {
    // Navigate to dashboard builder
    await page.click('[data-testid=new-dashboard-button]');
    await expect(page).toHaveURL('/dashboard/new');

    // Set dashboard name
    await page.fill('[data-testid=dashboard-name]', 'Test Dashboard');
    
    // Add a bar chart
    await page.dragAndDrop(
      '[data-testid=chart-bar]',
      '[data-testid=dashboard-canvas]'
    );

    // Configure chart data source
    await page.click('[data-testid=chart-0]');
    await page.selectOption('[data-testid=data-source-select]', 'test-data-source');
    await page.fill('[data-testid=sql-query]', 'SELECT category, COUNT(*) as count FROM test_table GROUP BY category');
    await page.click('[data-testid=apply-query]');

    // Save dashboard
    await page.click('[data-testid=save-dashboard-button]');
    await expect(page.locator('[data-testid=save-success-message]')).toBeVisible();

    // Verify dashboard is saved
    await page.goto('/dashboard');
    await expect(page.locator('text=Test Dashboard')).toBeVisible();
  });

  test('should display chart data correctly', async ({ page }) => {
    // Create dashboard with chart (reuse steps from previous test)
    await page.click('[data-testid=new-dashboard-button]');
    await page.fill('[data-testid=dashboard-name]', 'Data Test Dashboard');
    await page.dragAndDrop(
      '[data-testid=chart-bar]',
      '[data-testid=dashboard-canvas]'
    );
    await page.click('[data-testid=chart-0]');
    await page.selectOption('[data-testid=data-source-select]', 'test-data-source');
    await page.fill('[data-testid=sql-query]', 'SELECT category, COUNT(*) as count FROM test_table GROUP BY category');
    await page.click('[data-testid=apply-query]');
    await page.click('[data-testid=save-dashboard-button]');

    // Navigate to dashboard viewer
    await page.click('[data-testid=view-dashboard-button]');

    // Verify chart renders with data
    await expect(page.locator('[data-testid=chart-0]')).toBeVisible();
    await expect(page.locator('[data-testid=chart-bar]')).toBeVisible();
    
    // Verify chart has data points
    const chartBars = page.locator('[data-testid=chart-bar] rect');
    await expect(chartBars).toHaveCount(3); // Assuming 3 categories in test data
  });
});
```

