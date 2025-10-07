import { scheduleService, ScheduleService } from '../scheduleService.js';

describe('scheduleService', () => {
  let service: ScheduleService;

  beforeEach(() => {
    service = new ScheduleService();
  });

  describe('create', () => {
    it('creates a schedule with valid cron and timezone', () => {
      const input = {
        subjectType: 'dashboard' as const,
        subjectId: 'dash_123',
        cronExpression: '0 0 * * *',
        timezone: 'America/New_York',
      };
      const schedule = service.create(input);
      expect(schedule.id).toBeDefined();
      expect(schedule.subjectType).toBe('dashboard');
      expect(schedule.subjectId).toBe('dash_123');
      expect(schedule.cronExpression).toBe('0 0 * * *');
      expect(schedule.timezone).toBe('America/New_York');
      expect(schedule.enabled).toBe(true);
      expect(schedule.nextRunAt).toBeDefined();
    });

    it('defaults timezone to UTC if not provided', () => {
      const input = {
        subjectType: 'query' as const,
        subjectId: 'q_456',
        cronExpression: '*/5 * * * *',
      };
      const schedule = service.create(input);
      expect(schedule.timezone).toBe('UTC');
    });

    it('rejects invalid cron expression', () => {
      const input = {
        subjectType: 'pipeline' as const,
        subjectId: 'pipe_789',
        cronExpression: 'invalid cron',
      };
      expect(() => service.create(input)).toThrow(/Invalid cron/);
    });

    it('rejects invalid timezone', () => {
      const input = {
        subjectType: 'dashboard' as const,
        subjectId: 'dash_123',
        cronExpression: '0 0 * * *',
        timezone: 'Invalid/Timezone',
      };
      expect(() => service.create(input)).toThrow(/Invalid timezone/);
    });

    it('rejects missing required fields', () => {
      expect(() => service.create({} as any)).toThrow(/required/);
    });

    it('sets enabled to false when specified', () => {
      const input = {
        subjectType: 'dashboard' as const,
        subjectId: 'dash_123',
        cronExpression: '0 0 * * *',
        enabled: false,
      };
      const schedule = service.create(input);
      expect(schedule.enabled).toBe(false);
      expect(schedule.nextRunAt).toBeUndefined();
    });
  });

  describe('list', () => {
    it('returns empty array initially', () => {
      expect(service.list()).toEqual([]);
    });

    it('returns all created schedules', () => {
      service.create({ subjectType: 'dashboard', subjectId: 'd1', cronExpression: '0 0 * * *' });
      service.create({ subjectType: 'query', subjectId: 'q1', cronExpression: '*/5 * * * *' });
      const schedules = service.list();
      expect(schedules.length).toBe(2);
    });
  });

  describe('get', () => {
    it('returns schedule by id', () => {
      const created = service.create({ subjectType: 'dashboard', subjectId: 'd1', cronExpression: '0 0 * * *' });
      const retrieved = service.get(created.id);
      expect(retrieved).toEqual(created);
    });

    it('returns undefined for non-existent id', () => {
      expect(service.get('nonexistent')).toBeUndefined();
    });
  });

  describe('update', () => {
    it('updates cron expression', () => {
      const created = service.create({ subjectType: 'dashboard', subjectId: 'd1', cronExpression: '0 0 * * *' });
      const updated = service.update(created.id, { cronExpression: '0 12 * * *' });
      expect(updated.cronExpression).toBe('0 12 * * *');
      expect(Date.parse(updated.updatedAt)).toBeGreaterThanOrEqual(Date.parse(created.updatedAt));
    });

    it('updates timezone', () => {
      const created = service.create({ subjectType: 'dashboard', subjectId: 'd1', cronExpression: '0 0 * * *' });
      const updated = service.update(created.id, { timezone: 'Europe/London' });
      expect(updated.timezone).toBe('Europe/London');
    });

    it('updates enabled status', () => {
      const created = service.create({ subjectType: 'dashboard', subjectId: 'd1', cronExpression: '0 0 * * *' });
      const updated = service.update(created.id, { enabled: false });
      expect(updated.enabled).toBe(false);
      expect(updated.nextRunAt).toBeUndefined();
    });

    it('rejects invalid cron in update', () => {
      const created = service.create({ subjectType: 'dashboard', subjectId: 'd1', cronExpression: '0 0 * * *' });
      expect(() => service.update(created.id, { cronExpression: 'bad' })).toThrow(/Invalid cron/);
    });

    it('throws for non-existent schedule', () => {
      expect(() => service.update('nonexistent', { enabled: false })).toThrow(/not found/);
    });
  });

  describe('delete', () => {
    it('deletes existing schedule', () => {
      const created = service.create({ subjectType: 'dashboard', subjectId: 'd1', cronExpression: '0 0 * * *' });
      service.delete(created.id);
      expect(service.get(created.id)).toBeUndefined();
    });

    it('throws for non-existent schedule', () => {
      expect(() => service.delete('nonexistent')).toThrow(/not found/);
    });
  });

  describe('pause', () => {
    it('sets enabled to false', () => {
      const created = service.create({ subjectType: 'dashboard', subjectId: 'd1', cronExpression: '0 0 * * *' });
      const paused = service.pause(created.id);
      expect(paused.enabled).toBe(false);
      expect(paused.nextRunAt).toBeUndefined();
    });
  });

  describe('resume', () => {
    it('sets enabled to true and computes nextRunAt', () => {
      const created = service.create({ subjectType: 'dashboard', subjectId: 'd1', cronExpression: '0 0 * * *', enabled: false });
      const resumed = service.resume(created.id);
      expect(resumed.enabled).toBe(true);
      expect(resumed.nextRunAt).toBeDefined();
    });
  });

  describe('runNow', () => {
    it('creates a run with pending status', () => {
      const created = service.create({ subjectType: 'dashboard', subjectId: 'd1', cronExpression: '0 0 * * *' });
      const run = service.runNow(created.id);
      expect(run.id).toBeDefined();
      expect(run.scheduleId).toBe(created.id);
      expect(run.status).toBe('pending');
      expect(run.logs.length).toBeGreaterThan(0);
    });

    it('throws for non-existent schedule', () => {
      expect(() => service.runNow('nonexistent')).toThrow(/not found/);
    });

    it('transitions to success after async execution', async () => {
      const created = service.create({ subjectType: 'dashboard', subjectId: 'd1', cronExpression: '0 0 * * *' });
      const run = service.runNow(created.id);
      // Wait for async execution to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      const updated = service.getRun(run.id);
      expect(updated?.status).toBe('success');
      expect(updated?.endedAt).toBeDefined();
    });
  });

  describe('getRun', () => {
    it('returns run by id', () => {
      const created = service.create({ subjectType: 'dashboard', subjectId: 'd1', cronExpression: '0 0 * * *' });
      const run = service.runNow(created.id);
      const retrieved = service.getRun(run.id);
      expect(retrieved).toEqual(run);
    });

    it('returns undefined for non-existent run', () => {
      expect(service.getRun('nonexistent')).toBeUndefined();
    });
  });

  describe('listRuns', () => {
    it('returns all runs', () => {
      const s1 = service.create({ subjectType: 'dashboard', subjectId: 'd1', cronExpression: '0 0 * * *' });
      const s2 = service.create({ subjectType: 'query', subjectId: 'q1', cronExpression: '*/5 * * * *' });
      service.runNow(s1.id);
      service.runNow(s2.id);
      const runs = service.listRuns();
      expect(runs.length).toBe(2);
    });

    it('filters runs by scheduleId', () => {
      const s1 = service.create({ subjectType: 'dashboard', subjectId: 'd1', cronExpression: '0 0 * * *' });
      const s2 = service.create({ subjectType: 'query', subjectId: 'q1', cronExpression: '*/5 * * * *' });
      service.runNow(s1.id);
      service.runNow(s2.id);
      const runs = service.listRuns(s1.id);
      expect(runs.length).toBe(1);
      expect(runs[0].scheduleId).toBe(s1.id);
    });
  });
});

