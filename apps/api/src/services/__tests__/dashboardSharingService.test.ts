import { dashboardSharingService } from '../dashboardSharingService.js';
import { query } from '../../database/connection.js';

jest.mock('../../database/connection.js');
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('DashboardSharingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('shareWithUser', () => {
    it('creates a share with user', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 's-1',
          dashboard_id: 'd-1',
          user_id: 'u-1',
          permission: 'view',
          created_at: new Date(),
          created_by: 'u-owner',
        }],
        rowCount: 1,
      } as any);

      const share = await dashboardSharingService.shareWithUser(
        { dashboardId: 'd-1', userId: 'u-1', permission: 'view' },
        'u-owner'
      );

      expect(share.id).toBe('s-1');
      expect(share.permission).toBe('view');
    });
  });

  describe('listShares', () => {
    it('lists all shares for a dashboard', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 's-1', dashboard_id: 'd-1', user_id: 'u-1', permission: 'view', created_at: new Date(), created_by: 'u-owner' },
          { id: 's-2', dashboard_id: 'd-1', user_id: 'u-2', permission: 'edit', created_at: new Date(), created_by: 'u-owner' },
        ],
        rowCount: 2,
      } as any);

      const shares = await dashboardSharingService.listShares('d-1');
      expect(shares).toHaveLength(2);
    });
  });

  describe('removeShare', () => {
    it('removes a share', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any);
      const ok = await dashboardSharingService.removeShare('d-1', 'u-1');
      expect(ok).toBe(true);
    });
  });

  describe('checkUserAccess', () => {
    it('returns owner for dashboard owner', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ owner_id: 'u-1' }],
        rowCount: 1,
      } as any);

      const access = await dashboardSharingService.checkUserAccess('d-1', 'u-1');
      expect(access).toBe('owner');
    });

    it('returns permission for shared user', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ owner_id: 'u-owner' }],
        rowCount: 1,
      } as any);
      mockQuery.mockResolvedValueOnce({
        rows: [{ permission: 'edit' }],
        rowCount: 1,
      } as any);

      const access = await dashboardSharingService.checkUserAccess('d-1', 'u-2');
      expect(access).toBe('edit');
    });

    it('returns null for no access', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ owner_id: 'u-owner' }],
        rowCount: 1,
      } as any);
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      const access = await dashboardSharingService.checkUserAccess('d-1', 'u-3');
      expect(access).toBeNull();
    });
  });

  describe('createPublicLink', () => {
    it('creates a public link with token', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'l-1',
          dashboard_id: 'd-1',
          token: 'abc123',
          expires_at: null,
          created_at: new Date(),
          created_by: 'u-1',
        }],
        rowCount: 1,
      } as any);

      const link = await dashboardSharingService.createPublicLink(
        { dashboardId: 'd-1' },
        'u-1'
      );

      expect(link.id).toBe('l-1');
      expect(link.token).toBeDefined();
    });
  });

  describe('getPublicLink', () => {
    it('returns link if valid and not expired', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'l-1',
          dashboard_id: 'd-1',
          token: 'abc123',
          expires_at: null,
          created_at: new Date(),
          created_by: 'u-1',
        }],
        rowCount: 1,
      } as any);

      const link = await dashboardSharingService.getPublicLink('abc123');
      expect(link?.token).toBe('abc123');
    });

    it('returns null if expired', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      } as any);

      const link = await dashboardSharingService.getPublicLink('expired-token');
      expect(link).toBeNull();
    });
  });

  describe('revokePublicLink', () => {
    it('revokes a public link', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any);
      const ok = await dashboardSharingService.revokePublicLink('l-1');
      expect(ok).toBe(true);
    });
  });
});

