import { loginSchema } from '../authValidators.js';

describe('Auth Validators', () => {
  describe('loginSchema', () => {
    it('should validate correct login credentials', () => {
      const validData = {
        username: 'testuser',
        password: 'password123',
      };

      const { error, value } = loginSchema.validate(validData);

      expect(error).toBeUndefined();
      expect(value).toEqual(validData);
    });

    it('should reject username that is too short', () => {
      const invalidData = {
        username: 'ab',
        password: 'password123',
      };

      const { error } = loginSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('at least 3 characters');
    });

    it('should reject username that is too long', () => {
      const invalidData = {
        username: 'a'.repeat(31),
        password: 'password123',
      };

      const { error } = loginSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('not exceed 30 characters');
    });

    it('should reject username with non-alphanumeric characters', () => {
      const invalidData = {
        username: 'test@user',
        password: 'password123',
      };

      const { error } = loginSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('alphanumeric');
    });

    it('should reject password that is too short', () => {
      const invalidData = {
        username: 'testuser',
        password: 'pass123',
      };

      const { error } = loginSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('at least 8 characters');
    });

    it('should reject password without letters', () => {
      const invalidData = {
        username: 'testuser',
        password: '12345678',
      };

      const { error } = loginSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('at least one letter and one number');
    });

    it('should reject password without numbers', () => {
      const invalidData = {
        username: 'testuser',
        password: 'password',
      };

      const { error } = loginSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('at least one letter and one number');
    });

    it('should reject missing username', () => {
      const invalidData = {
        password: 'password123',
      };

      const { error } = loginSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Username is required');
    });

    it('should reject missing password', () => {
      const invalidData = {
        username: 'testuser',
      };

      const { error } = loginSchema.validate(invalidData);

      expect(error).toBeDefined();
      expect(error?.details[0].message).toContain('Password is required');
    });

    it('should strip unknown fields', () => {
      const dataWithExtra = {
        username: 'testuser',
        password: 'password123',
        extraField: 'should be removed',
      };

      const { error, value } = loginSchema.validate(dataWithExtra, {
        stripUnknown: true,
      });

      expect(error).toBeUndefined();
      expect(value).toEqual({
        username: 'testuser',
        password: 'password123',
      });
      expect(value).not.toHaveProperty('extraField');
    });
  });
});

