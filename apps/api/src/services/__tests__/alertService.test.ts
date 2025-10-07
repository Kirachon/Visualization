import { alertService, AlertService } from '../alertService.js';

describe('alertService', () => {
  let service: AlertService;
  const tenantId = 'tenant_123';

  beforeEach(() => {
    service = new AlertService();
  });

  describe('create', () => {
    it('creates an alert with valid inputs', () => {
      const input = {
        tenantId,
        name: 'High CPU Alert',
        subjectRef: 'dashboard:123',
        condition: { operator: '>' as const, threshold: 80, window: '5m' as const, aggregation: 'avg' as const },
        channels: ['email' as const, 'slack' as const],
      };
      const alert = service.create(input);
      expect(alert.id).toBeDefined();
      expect(alert.name).toBe('High CPU Alert');
      expect(alert.tenantId).toBe(tenantId);
      expect(alert.enabled).toBe(true);
    });

    it('rejects invalid operator', () => {
      const input = {
        tenantId,
        name: 'Test',
        subjectRef: 'query:456',
        condition: { operator: 'invalid' as any, threshold: 10 },
        channels: ['email' as const],
      };
      expect(() => service.create(input)).toThrow(/Invalid operator/);
    });

    it('rejects invalid window', () => {
      const input = {
        tenantId,
        name: 'Test',
        subjectRef: 'query:456',
        condition: { operator: '>' as const, threshold: 10, window: '10m' as any },
        channels: ['email' as const],
      };
      expect(() => service.create(input)).toThrow(/Invalid window/);
    });

    it('rejects invalid aggregation', () => {
      const input = {
        tenantId,
        name: 'Test',
        subjectRef: 'query:456',
        condition: { operator: '>' as const, threshold: 10, aggregation: 'median' as any },
        channels: ['email' as const],
      };
      expect(() => service.create(input)).toThrow(/Invalid aggregation/);
    });

    it('rejects empty channels', () => {
      const input = {
        tenantId,
        name: 'Test',
        subjectRef: 'query:456',
        condition: { operator: '>' as const, threshold: 10 },
        channels: [],
      };
      expect(() => service.create(input)).toThrow(/At least one channel/);
    });

    it('rejects invalid channel', () => {
      const input = {
        tenantId,
        name: 'Test',
        subjectRef: 'query:456',
        condition: { operator: '>' as const, threshold: 10 },
        channels: ['invalid' as any],
      };
      expect(() => service.create(input)).toThrow(/Invalid channel/);
    });

    it('rejects missing required fields', () => {
      expect(() => service.create({} as any)).toThrow(/required/);
    });
  });

  describe('list', () => {
    it('returns only alerts for specified tenant', () => {
      service.create({ tenantId, name: 'A1', subjectRef: 'd:1', condition: { operator: '>' as const, threshold: 10 }, channels: ['email' as const] });
      service.create({ tenantId: 'other', name: 'A2', subjectRef: 'd:2', condition: { operator: '<' as const, threshold: 5 }, channels: ['slack' as const] });
      const alerts = service.list(tenantId);
      expect(alerts.length).toBe(1);
      expect(alerts[0].name).toBe('A1');
    });
  });

  describe('get', () => {
    it('returns alert for correct tenant', () => {
      const created = service.create({ tenantId, name: 'A1', subjectRef: 'd:1', condition: { operator: '>' as const, threshold: 10 }, channels: ['email' as const] });
      const retrieved = service.get(created.id, tenantId);
      expect(retrieved).toEqual(created);
    });

    it('returns undefined for wrong tenant', () => {
      const created = service.create({ tenantId, name: 'A1', subjectRef: 'd:1', condition: { operator: '>' as const, threshold: 10 }, channels: ['email' as const] });
      expect(service.get(created.id, 'other')).toBeUndefined();
    });
  });

  describe('update', () => {
    it('updates alert fields', () => {
      const created = service.create({ tenantId, name: 'A1', subjectRef: 'd:1', condition: { operator: '>' as const, threshold: 10 }, channels: ['email' as const] });
      const updated = service.update(created.id, tenantId, { name: 'A1 Updated', enabled: false });
      expect(updated.name).toBe('A1 Updated');
      expect(updated.enabled).toBe(false);
    });

    it('validates condition on update', () => {
      const created = service.create({ tenantId, name: 'A1', subjectRef: 'd:1', condition: { operator: '>' as const, threshold: 10 }, channels: ['email' as const] });
      expect(() => service.update(created.id, tenantId, { condition: { operator: 'bad' as any } })).toThrow(/Invalid operator/);
    });

    it('throws for non-existent alert', () => {
      expect(() => service.update('nonexistent', tenantId, { enabled: false })).toThrow(/not found/);
    });
  });

  describe('delete', () => {
    it('deletes existing alert', () => {
      const created = service.create({ tenantId, name: 'A1', subjectRef: 'd:1', condition: { operator: '>' as const, threshold: 10 }, channels: ['email' as const] });
      service.delete(created.id, tenantId);
      expect(service.get(created.id, tenantId)).toBeUndefined();
    });

    it('throws for non-existent alert', () => {
      expect(() => service.delete('nonexistent', tenantId)).toThrow(/not found/);
    });
  });

  describe('test', () => {
    it('sends test notifications to all channels', () => {
      const created = service.create({ tenantId, name: 'A1', subjectRef: 'd:1', condition: { operator: '>' as const, threshold: 10 }, channels: ['email' as const, 'slack' as const] });
      const result = service.test(created.id, tenantId);
      expect(result.success).toBe(true);
      expect(result.deliveries.length).toBe(2);
      expect(result.deliveries[0].status).toBe('sent');
    });

    it('creates an event in history', () => {
      const created = service.create({ tenantId, name: 'A1', subjectRef: 'd:1', condition: { operator: '>' as const, threshold: 10 }, channels: ['email' as const] });
      service.test(created.id, tenantId);
      const history = service.getHistory(created.id, tenantId);
      expect(history.length).toBe(1);
      expect(history[0].severity).toBe('info');
    });
  });

  describe('getHistory', () => {
    it('returns events for alert', () => {
      const created = service.create({ tenantId, name: 'A1', subjectRef: 'd:1', condition: { operator: '>' as const, threshold: 10 }, channels: ['email' as const] });
      service.test(created.id, tenantId);
      service.test(created.id, tenantId);
      const history = service.getHistory(created.id, tenantId);
      expect(history.length).toBe(2);
    });

    it('respects limit parameter', () => {
      const created = service.create({ tenantId, name: 'A1', subjectRef: 'd:1', condition: { operator: '>' as const, threshold: 10 }, channels: ['email' as const] });
      service.test(created.id, tenantId);
      service.test(created.id, tenantId);
      service.test(created.id, tenantId);
      const history = service.getHistory(created.id, tenantId, 2);
      expect(history.length).toBe(2);
    });
  });
});

