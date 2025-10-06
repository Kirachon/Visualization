import { sessionService } from '../sessionService.js';
import { query } from '../../database/connection.js';

jest.mock('../../database/connection.js');
const mockQuery = query as jest.MockedFunction<typeof query>;

describe('SessionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a session', async () => {
      const expiresAt = new Date(Date.now() + 3600000);
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 's-1',
          user_id: 'u1',
          token: 'token123',
          expires_at: expiresAt,
          last_activity_at: new Date(),
          ip_address: '127.0.0.1',
          user_agent: 'test-agent',
          created_at: new Date(),
        }],
        rowCount: 1,
      } as any);

      const session = await sessionService.create({
        userId: 'u1',
        token: 'token123',
        expiresAt,
        ipAddress: '127.0.0.1',
        userAgent: 'test-agent',
      });

      expect(session.id).toBe('s-1');
      expect(session.token).toBe('token123');
    });
  });

  describe('getByToken', () => {
    it('returns session if valid and not expired', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 's-1',
          user_id: 'u1',
          token: 'token123',
          expires_at: new Date(Date.now() + 3600000),
          last_activity_at: new Date(),
          created_at: new Date(),
        }],
        rowCount: 1,
      } as any);

      const session = await sessionService.getByToken('token123');
      expect(session?.token).toBe('token123');
    });

    it('returns null if expired', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      const session = await sessionService.getByToken('expired-token');
      expect(session).toBeNull();
    });
  });

  describe('listUserSessions', () => {
    it('lists active sessions for user', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 's-1', user_id: 'u1', token: 'token1', expires_at: new Date(Date.now() + 3600000), last_activity_at: new Date(), created_at: new Date() },
          { id: 's-2', user_id: 'u1', token: 'token2', expires_at: new Date(Date.now() + 3600000), last_activity_at: new Date(), created_at: new Date() },
        ],
        rowCount: 2,
      } as any);

      const sessions = await sessionService.listUserSessions('u1');
      expect(sessions).toHaveLength(2);
    });
  });

  describe('updateActivity', () => {
    it('updates last activity timestamp', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any);
      const ok = await sessionService.updateActivity('token123');
      expect(ok).toBe(true);
    });
  });

  describe('revoke', () => {
    it('revokes a session', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any);
      const ok = await sessionService.revoke('token123');
      expect(ok).toBe(true);
    });
  });

  describe('revokeAllUserSessions', () => {
    it('revokes all sessions for user', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 3 } as any);
      const count = await sessionService.revokeAllUserSessions('u1');
      expect(count).toBe(3);
    });
  });

  describe('cleanupExpired', () => {
    it('removes expired sessions', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 5 } as any);
      const count = await sessionService.cleanupExpired();
      expect(count).toBe(5);
    });
  });
});

