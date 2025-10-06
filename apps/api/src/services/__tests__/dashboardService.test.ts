import { dashboardService } from '../dashboardService.js';
import { query } from '../../database/connection.js';

jest.mock('../../database/connection.js');
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('DashboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a dashboard with default layout', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'd-1',
          name: 'Test Dashboard',
          description: null,
          layout: { cols: 12, rowHeight: 100, components: [] },
          tenant_id: 't1',
          owner_id: 'u1',
          is_public: false,
          created_at: new Date(),
          updated_at: new Date(),
        }],
        rowCount: 1,
      } as any);

      const dashboard = await dashboardService.create('t1', 'u1', { name: 'Test Dashboard' });
      expect(dashboard.id).toBe('d-1');
      expect(dashboard.layout.cols).toBe(12);
    });
  });

  describe('list', () => {
    it('lists dashboards for tenant', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'd-1', name: 'D1', description: null, layout: {}, tenant_id: 't1', owner_id: 'u1', is_public: false, created_at: new Date(), updated_at: new Date() },
        ],
        rowCount: 1,
      } as any);

      const list = await dashboardService.list('t1');
      expect(list).toHaveLength(1);
      expect(list[0].name).toBe('D1');
    });
  });

  describe('getById', () => {
    it('returns null if not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      const dashboard = await dashboardService.getById('d-x', 't1');
      expect(dashboard).toBeNull();
    });
  });

  describe('update', () => {
    it('updates a dashboard', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'd-1', name: 'Old', description: null, layout: {}, tenant_id: 't1', owner_id: 'u1', is_public: false, created_at: new Date(), updated_at: new Date() }],
        rowCount: 1,
      } as any);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'd-1', name: 'New', description: null, layout: {}, tenant_id: 't1', owner_id: 'u1', is_public: false, created_at: new Date(), updated_at: new Date() }],
        rowCount: 1,
      } as any);

      const dashboard = await dashboardService.update('d-1', 't1', { name: 'New' });
      expect(dashboard?.name).toBe('New');
    });
  });

  describe('remove', () => {
    it('deletes a dashboard', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any);
      const ok = await dashboardService.remove('d-1', 't1');
      expect(ok).toBe(true);
    });
  });

  describe('validateDataBinding', () => {
    it('validates data source exists', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 'ds-1' }], rowCount: 1 } as any);
      const valid = await dashboardService.validateDataBinding('ds-1', 't1');
      expect(valid).toBe(true);
    });
  });
});

