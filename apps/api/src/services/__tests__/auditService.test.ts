import { auditService } from '../auditService.js';
import { query } from '../../database/connection.js';

jest.mock('../../database/connection.js');
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('AuditService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('creates an audit log entry', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'a-1',
          tenant_id: 't1',
          user_id: 'u1',
          action: 'CREATE',
          resource_type: 'dashboard',
          resource_id: 'd1',
          details: { name: 'Test' },
          ip_address: '127.0.0.1',
          user_agent: 'test-agent',
          created_at: new Date(),
        }],
        rowCount: 1,
      } as any);

      const log = await auditService.log({
        tenantId: 't1',
        userId: 'u1',
        action: 'CREATE',
        resourceType: 'dashboard',
        resourceId: 'd1',
        details: { name: 'Test' },
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });

      expect(log.id).toBe('a-1');
      expect(log.action).toBe('CREATE');
    });
  });

  describe('list', () => {
    it('lists audit logs for tenant', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'a-1', tenant_id: 't1', user_id: 'u1', action: 'CREATE', resource_type: 'dashboard', resource_id: 'd1', details: {}, created_at: new Date() },
          { id: 'a-2', tenant_id: 't1', user_id: 'u1', action: 'UPDATE', resource_type: 'dashboard', resource_id: 'd1', details: {}, created_at: new Date() },
        ],
        rowCount: 2,
      } as any);

      const logs = await auditService.list('t1');
      expect(logs).toHaveLength(2);
    });

    it('filters by userId', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'a-1', tenant_id: 't1', user_id: 'u1', action: 'CREATE', resource_type: 'dashboard', resource_id: 'd1', details: {}, created_at: new Date() },
        ],
        rowCount: 1,
      } as any);

      const logs = await auditService.list('t1', { userId: 'u1' });
      expect(logs).toHaveLength(1);
    });

    it('filters by resourceType', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'a-1', tenant_id: 't1', user_id: 'u1', action: 'CREATE', resource_type: 'dashboard', resource_id: 'd1', details: {}, created_at: new Date() },
        ],
        rowCount: 1,
      } as any);

      const logs = await auditService.list('t1', { resourceType: 'dashboard' });
      expect(logs).toHaveLength(1);
    });

    it('applies limit', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'a-1', tenant_id: 't1', user_id: 'u1', action: 'CREATE', resource_type: 'dashboard', resource_id: 'd1', details: {}, created_at: new Date() },
        ],
        rowCount: 1,
      } as any);

      const logs = await auditService.list('t1', { limit: 10 });
      expect(logs).toHaveLength(1);
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        expect.arrayContaining(['t1', 10])
      );
    });
  });

  describe('getById', () => {
    it('returns audit log by id', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'a-1', tenant_id: 't1', user_id: 'u1', action: 'CREATE', resource_type: 'dashboard', resource_id: 'd1', details: {}, created_at: new Date() },
        ],
        rowCount: 1,
      } as any);

      const log = await auditService.getById('a-1', 't1');
      expect(log?.id).toBe('a-1');
    });

    it('returns null if not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      const log = await auditService.getById('a-x', 't1');
      expect(log).toBeNull();
    });
  });
});

