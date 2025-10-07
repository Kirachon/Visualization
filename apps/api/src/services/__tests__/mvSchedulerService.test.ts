import { jest } from '@jest/globals';
import { mvCatalogService } from '../mvCatalogService.js';
import { refreshOnce, startMvScheduler } from '../mvSchedulerService.js';

describe('mvSchedulerService', () => {
  const tenantId = 'tenant-test';
  test('refreshOnce marks refreshed', async () => {
    const rec = await mvCatalogService.create(tenantId, { name: 'mv', definitionSql: 'select * from t', enabled: true });
    const status = await refreshOnce(tenantId, rec.id);
    expect(status).toBe('success');
    const got = await mvCatalogService.get(tenantId, rec.id);
    expect(got?.lastRefreshStatus).toBe('success');
  });

  test('startMvScheduler does nothing when disabled', () => {
    const old = process.env.MV_AUTO_REFRESH_ENABLE;
    process.env.MV_AUTO_REFRESH_ENABLE = 'false';
    jest.useFakeTimers();
    expect(()=>startMvScheduler()).not.toThrow();
    jest.advanceTimersByTime(120000);
    jest.useRealTimers();
    process.env.MV_AUTO_REFRESH_ENABLE = old;
  });
});

