import { presenceService } from '../services/presenceService.js';
import { query as dbQuery } from '../database/connection.js';

jest.mock('../database/connection.js', () => ({
  query: jest.fn(),
}));

const query = dbQuery as jest.MockedFunction<typeof dbQuery> as unknown as jest.Mock;

describe('PresenceService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('maps getActiveUsers rows correctly', async () => {
    query.mockResolvedValueOnce({
      rows: [
        {
          id: 'p1',
          tenant_id: 't1',
          dashboard_id: 'd1',
          user_id: 'u1',
          cursor_position: { x: 10, y: 20 },
          last_seen_at: new Date('2025-01-01T00:00:00Z'),
        },
      ],
    } as any);

    const result = await presenceService.getActiveUsers({ tenantId: 't1', dashboardId: 'd1', withinSeconds: 30 });

    expect(query).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'p1',
      tenantId: 't1',
      dashboardId: 'd1',
      userId: 'u1',
      cursorPosition: { x: 10, y: 20 },
      lastSeenAt: new Date('2025-01-01T00:00:00Z'),
    });
  });

  it('calls upsertPresence with expected SQL params', async () => {
    query.mockResolvedValueOnce({ rows: [], rowCount: 1 } as any);
    await presenceService.upsertPresence({ tenantId: 't1', dashboardId: 'd1', userId: 'u1', cursorPosition: { x: 1 } });
    expect(query).toHaveBeenCalledTimes(1);
    const args = query.mock.calls[0];
    expect(args[1]).toEqual(['t1', 'd1', 'u1', { x: 1 }]);
  });
});

