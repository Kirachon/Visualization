import { query } from '../database/connection.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import type { User, CreateUserRequest, UpdateUserRequest } from '../models/User.js';

const SALT_ROUNDS = 10;
const RESET_TOKEN_EXPIRY_HOURS = 24;

export class UserService {
  async create(input: CreateUserRequest): Promise<User> {
    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const res = await query(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, tenant_id, role_id, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id, username, email, first_name, last_name, tenant_id, role_id, is_active, 
                 profile_picture, phone_number, timezone, language, created_at, updated_at, last_login_at`,
      [input.username, input.email, passwordHash, input.firstName, input.lastName, input.tenantId, input.roleId]
    );
    return this.hydrate(res.rows[0]);
  }

  async list(tenantId: string, includeDeleted = false): Promise<User[]> {
    const sql = includeDeleted
      ? `SELECT * FROM users WHERE tenant_id = $1 ORDER BY created_at DESC`
      : `SELECT * FROM users WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC`;
    const res = await query(sql, [tenantId]);
    return res.rows.map((r) => this.hydrate(r));
  }

  async getById(id: string, tenantId: string): Promise<User | null> {
    const res = await query(
      `SELECT * FROM users WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [id, tenantId]
    );
    if (res.rows.length === 0) return null;
    return this.hydrate(res.rows[0]);
  }

  async getByEmail(email: string): Promise<User | null> {
    const res = await query(
      `SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );
    if (res.rows.length === 0) return null;
    return this.hydrate(res.rows[0]);
  }

  async update(id: string, tenantId: string, input: UpdateUserRequest): Promise<User | null> {
    const existing = await this.getById(id, tenantId);
    if (!existing) return null;

    const res = await query(
      `UPDATE users SET 
        email = COALESCE($1, email),
        first_name = COALESCE($2, first_name),
        last_name = COALESCE($3, last_name),
        role_id = COALESCE($4, role_id),
        is_active = COALESCE($5, is_active),
        profile_picture = COALESCE($6, profile_picture),
        phone_number = COALESCE($7, phone_number),
        timezone = COALESCE($8, timezone),
        language = COALESCE($9, language),
        updated_at = NOW()
       WHERE id = $10 AND tenant_id = $11
       RETURNING *`,
      [
        input.email ?? null,
        input.firstName ?? null,
        input.lastName ?? null,
        input.roleId ?? null,
        input.isActive ?? null,
        input.profilePicture ?? null,
        input.phoneNumber ?? null,
        input.timezone ?? null,
        input.language ?? null,
        id,
        tenantId,
      ]
    );

    return this.hydrate(res.rows[0]);
  }

  async remove(id: string, tenantId: string): Promise<boolean> {
    // Soft delete
    const res = await query(
      `UPDATE users SET deleted_at = NOW(), updated_at = NOW()
       WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL`,
      [id, tenantId]
    );
    return (res.rowCount ?? 0) > 0;
  }

  async initiatePasswordReset(email: string): Promise<{ token: string; expiresAt: Date } | null> {
    const user = await this.getByEmail(email);
    if (!user) return null;

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_EXPIRY_HOURS);

    await query(
      `UPDATE users SET password_reset_token = $1, password_reset_expires = $2, updated_at = NOW()
       WHERE id = $3`,
      [token, expiresAt.toISOString(), user.id]
    );

    return { token, expiresAt };
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const res = await query(
      `SELECT id FROM users 
       WHERE password_reset_token = $1 
       AND password_reset_expires > NOW() 
       AND deleted_at IS NULL`,
      [token]
    );

    if (res.rows.length === 0) return false;

    const userId = res.rows[0].id;
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await query(
      `UPDATE users SET 
        password_hash = $1, 
        password_reset_token = NULL, 
        password_reset_expires = NULL,
        updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, userId]
    );

    return true;
  }

  async verifyPassword(userId: string, password: string): Promise<boolean> {
    const res = await query(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
    if (res.rows.length === 0) return false;
    return bcrypt.compare(password, res.rows[0].password_hash);
  }

  hydrate(row: any): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      tenantId: row.tenant_id,
      roleId: row.role_id,
      isActive: row.is_active,
      profilePicture: row.profile_picture,
      phoneNumber: row.phone_number,
      timezone: row.timezone,
      language: row.language,
      passwordResetToken: row.password_reset_token,
      passwordResetExpires: row.password_reset_expires,
      deletedAt: row.deleted_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLoginAt: row.last_login_at,
    };
  }
}

export const userService = new UserService();

