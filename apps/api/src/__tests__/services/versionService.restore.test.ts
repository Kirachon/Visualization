import { versionService } from '../../services/versionService.js';

jest.mock('../../database/connection.js', () => ({
  query: jest.fn(),
}));

const { query } = require('../../database/connection.js');

describe('versionService.restore', () => {
  beforeEach(() => {
    (query as jest.Mock).mockReset();
  });

  it('applies snapshot fields to dashboard', async () => {
    (query as jest.Mock)
      // First call: fetch version
      .mockResolvedValueOnce({ rows: [{ id: 'v1', dashboard_id: 'd1', version: 2, diff: { snapshot: { name: 'Restored', description: 'R', layout: { cols: 12 }, components: [] } }, label: null, author_id: 'u1', created_at: new Date() }] })
      // Second call: update dashboards
      .mockResolvedValueOnce({ rows: [{ id: 'd1' }], rowCount: 1 });

    const res = await versionService.restore('v1', 't1', 'u1');

    expect(res).toEqual({ dashboardId: 'd1', applied: { name: 'Restored', description: 'R', layout: { cols: 12 }, components: [] } });
    // Ensure UPDATE was issued
    expect((query as jest.Mock).mock.calls[1][0]).toMatch(/UPDATE dashboards SET/);
  });

  it('returns null if version not found', async () => {
    (query as jest.Mock).mockResolvedValueOnce({ rows: [] });
    const res = await versionService.restore('missing', 't1', 'u1');
    expect(res).toBeNull();
  });
});

