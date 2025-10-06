import { AuthService } from '../authService.js';
import { AuthenticationError } from '../../middleware/errorHandler.js';
import * as connection from '../../database/connection.js';
import bcrypt from 'bcrypt';

jest.mock('../../database/connection.js');
jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  const mockQuery = connection.query as jest.MockedFunction<
    typeof connection.query
  >;
  const mockBcryptCompare = bcrypt.compare as jest.MockedFunction<
    typeof bcrypt.compare
  >;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    const mockUser = {
      id: 'user-123',
      username: 'testuser',
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      tenant_id: 'tenant-123',
      role_id: 'role-123',
      role_name: 'Admin',
      password_hash: 'hashed_password',
      is_active: true,
    };

    it('should authenticate user with valid credentials', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [mockUser] } as any)
        .mockResolvedValueOnce({ rows: [] } as any);
      mockBcryptCompare.mockResolvedValue(true as never);

      const result = await authService.authenticate({
        username: 'testuser',
        password: 'password123',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.username).toBe('testuser');
    });

    it('should throw error for invalid username', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] } as any);

      await expect(
        authService.authenticate({
          username: 'nonexistent',
          password: 'password123',
        })
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw error for invalid password', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [mockUser] } as any);
      mockBcryptCompare.mockResolvedValue(false as never);

      await expect(
        authService.authenticate({
          username: 'testuser',
          password: 'wrongpassword',
        })
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw error for inactive user', async () => {
      const inactiveUser = { ...mockUser, is_active: false };
      mockQuery.mockResolvedValueOnce({ rows: [inactiveUser] } as any);

      await expect(
        authService.authenticate({
          username: 'testuser',
          password: 'password123',
        })
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const user = {
        id: 'user-123',
        username: 'testuser',
        tenant_id: 'tenant-123',
        role_id: 'role-123',
        role_name: 'Admin',
      };
      const token = authService.generateToken(user);
      const decoded = authService.verifyToken(token);

      expect(decoded.userId).toBe(user.id);
      expect(decoded.username).toBe(user.username);
    });

    it('should throw error for invalid token', () => {
      expect(() => authService.verifyToken('invalid-token')).toThrow(
        AuthenticationError
      );
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions', async () => {
      const mockPermissions = [
        { resource: 'dashboards', action: 'read' },
        { resource: 'dashboards', action: 'create' },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockPermissions } as any);

      const permissions = await authService.getUserPermissions('user-123');

      expect(permissions).toEqual([
        'dashboards:read',
        'dashboards:create',
      ]);
    });
  });

  describe('authorize', () => {
    it('should return true for authorized action', async () => {
      const mockPermissions = [
        { resource: 'dashboards', action: 'read' },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockPermissions } as any);

      const result = await authService.authorize(
        'user-123',
        'dashboards',
        'read'
      );

      expect(result).toBe(true);
    });

    it('should return false for unauthorized action', async () => {
      const mockPermissions = [
        { resource: 'dashboards', action: 'read' },
      ];
      mockQuery.mockResolvedValueOnce({ rows: mockPermissions } as any);

      const result = await authService.authorize(
        'user-123',
        'dashboards',
        'delete'
      );

      expect(result).toBe(false);
    });
  });
});

