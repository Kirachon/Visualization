import { userService } from '../userService.js';
import { query } from '../../database/connection.js';
import bcrypt from 'bcrypt';

jest.mock('../../database/connection.js');
jest.mock('bcrypt');

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('creates a user with hashed password', async () => {
      mockBcrypt.hash = jest.fn().mockResolvedValue('hashed_password');
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'u-1',
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          tenant_id: 't1',
          role_id: 'r1',
          is_active: true,
          profile_picture: null,
          phone_number: null,
          timezone: 'UTC',
          language: 'en',
          created_at: new Date(),
          updated_at: new Date(),
          last_login_at: null,
        }],
        rowCount: 1,
      } as any);

      const user = await userService.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        tenantId: 't1',
        roleId: 'r1',
      });

      expect(user.id).toBe('u-1');
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });
  });

  describe('list', () => {
    it('lists users for tenant excluding deleted', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'u-1', username: 'user1', email: 'u1@test.com', first_name: 'U', last_name: '1', tenant_id: 't1', role_id: 'r1', is_active: true, created_at: new Date(), updated_at: new Date() },
        ],
        rowCount: 1,
      } as any);

      const list = await userService.list('t1');
      expect(list).toHaveLength(1);
      expect(list[0].username).toBe('user1');
    });
  });

  describe('getById', () => {
    it('returns null if user not found', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      const user = await userService.getById('u-x', 't1');
      expect(user).toBeNull();
    });

    it('returns user if found', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'u-1', username: 'user1', email: 'u1@test.com', first_name: 'U', last_name: '1', tenant_id: 't1', role_id: 'r1', is_active: true, created_at: new Date(), updated_at: new Date() }],
        rowCount: 1,
      } as any);

      const user = await userService.getById('u-1', 't1');
      expect(user?.id).toBe('u-1');
    });
  });

  describe('update', () => {
    it('updates user profile', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'u-1', username: 'user1', email: 'old@test.com', first_name: 'Old', last_name: 'Name', tenant_id: 't1', role_id: 'r1', is_active: true, created_at: new Date(), updated_at: new Date() }],
        rowCount: 1,
      } as any);
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'u-1', username: 'user1', email: 'new@test.com', first_name: 'New', last_name: 'Name', tenant_id: 't1', role_id: 'r1', is_active: true, created_at: new Date(), updated_at: new Date() }],
        rowCount: 1,
      } as any);

      const user = await userService.update('u-1', 't1', { email: 'new@test.com', firstName: 'New' });
      expect(user?.email).toBe('new@test.com');
      expect(user?.firstName).toBe('New');
    });
  });

  describe('remove', () => {
    it('soft deletes a user', async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any);
      const ok = await userService.remove('u-1', 't1');
      expect(ok).toBe(true);
    });
  });

  describe('initiatePasswordReset', () => {
    it('generates reset token for valid email', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'u-1', email: 'test@example.com', deleted_at: null }],
        rowCount: 1,
      } as any);
      mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any);

      const result = await userService.initiatePasswordReset('test@example.com');
      expect(result).toBeDefined();
      expect(result?.token).toBeDefined();
      expect(result?.expiresAt).toBeInstanceOf(Date);
    });

    it('returns null for invalid email', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      const result = await userService.initiatePasswordReset('invalid@example.com');
      expect(result).toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('resets password with valid token', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'u-1' }],
        rowCount: 1,
      } as any);
      mockBcrypt.hash = jest.fn().mockResolvedValue('new_hashed_password');
      mockQuery.mockResolvedValueOnce({ rowCount: 1 } as any);

      const ok = await userService.resetPassword('valid-token', 'newpassword123');
      expect(ok).toBe(true);
    });

    it('returns false for invalid token', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [], rowCount: 0 } as any);
      const ok = await userService.resetPassword('invalid-token', 'newpassword123');
      expect(ok).toBe(false);
    });
  });

  describe('verifyPassword', () => {
    it('verifies correct password', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ password_hash: 'hashed_password' }],
        rowCount: 1,
      } as any);
      mockBcrypt.compare = jest.fn().mockResolvedValue(true);

      const ok = await userService.verifyPassword('u-1', 'correct_password');
      expect(ok).toBe(true);
    });

    it('rejects incorrect password', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ password_hash: 'hashed_password' }],
        rowCount: 1,
      } as any);
      mockBcrypt.compare = jest.fn().mockResolvedValue(false);

      const ok = await userService.verifyPassword('u-1', 'wrong_password');
      expect(ok).toBe(false);
    });
  });
});

