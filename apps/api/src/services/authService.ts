import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../database/connection.js';
import { AuthenticationError } from '../middleware/errorHandler.js';

interface LoginRequest {
  username: string;
  password: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  roleId: string;
  roleName: string;
  isActive: boolean;
}

interface AuthResult {
  user: Omit<User, 'password'>;
  token: string;
  refreshToken: string;
}

// Fail fast if JWT_SECRET is not set
const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is required but not set');
}

const JWT_EXPIRES_IN = '1h';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

export class AuthService {
  async authenticate(credentials: LoginRequest): Promise<AuthResult> {
    const { username, password } = credentials;

    // Fetch user from database
    const result = await query(
      `SELECT u.id, u.username, u.email, u.first_name, u.last_name, 
              u.tenant_id, u.role_id, u.password_hash, u.is_active, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      throw new AuthenticationError('Invalid username or password');
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new AuthenticationError('User account is inactive');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid username or password');
    }

    // Update last login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [
      user.id,
    ]);

    // Generate tokens
    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Return user data without password
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      tenantId: user.tenant_id,
      roleId: user.role_id,
      roleName: user.role_name,
      isActive: user.is_active,
    };

    return {
      user: userData,
      token,
      refreshToken,
    };
  }

  generateToken(user: any): string {
    return jwt.sign(
      {
        userId: user.id,
        username: user.username,
        tenantId: user.tenant_id,
        roleId: user.role_id,
        roleName: user.role_name,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  generateRefreshToken(user: any): string {
    return jwt.sign(
      {
        userId: user.id,
        type: 'refresh',
      },
      JWT_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
    );
  }

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    const decoded = this.verifyToken(refreshToken);

    if (decoded.type !== 'refresh') {
      throw new AuthenticationError('Invalid refresh token');
    }

    // Fetch user from database
    const result = await query(
      `SELECT u.id, u.username, u.tenant_id, u.role_id, u.is_active, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0 || !result.rows[0].is_active) {
      throw new AuthenticationError('User not found or inactive');
    }

    return this.generateToken(result.rows[0]);
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const result = await query(
      `SELECT p.resource, p.action
       FROM permissions p
       JOIN roles r ON p.role_id = r.id
       JOIN users u ON u.role_id = r.id
       WHERE u.id = $1`,
      [userId]
    );

    return result.rows.map((row) => `${row.resource}:${row.action}`);
  }

  async authorize(
    userId: string,
    resource: string,
    action: string
  ): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(`${resource}:${action}`);
  }
}

export const authService = new AuthService();

