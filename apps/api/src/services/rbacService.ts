/**
 * RBAC Service
 * Story 3.1: Role-Based Access Control
 * 
 * Core service for role-based access control, permissions checking, and authorization.
 */

import { query } from '../database/connection.js';
import { logger } from '../logger/logger.js';
import { auditService } from './auditService.js';

/**
 * Permission interface
 */
export interface Permission {
  id: string;
  action: string;
  resource: string;
  condition?: any;
  description?: string;
}

/**
 * Role interface
 */
export interface Role {
  id: string;
  name: string;
  inheritsFrom: string[];
  description?: string;
  isSystem: boolean;
}

/**
 * User role assignment interface
 */
export interface UserRole {
  userId: string;
  roleId: string;
  tenantId: string;
  expiresAt?: Date;
}

/**
 * RBAC Service Class
 */
export class RBACService {
  /**
   * Check if user has permission
   */
  async hasPermission(
    userId: string,
    tenantId: string,
    action: string,
    resource: string,
    resourceId?: string
  ): Promise<boolean> {
    try {
      // Get user's roles (including inherited roles)
      const roles = await this.getUserRoles(userId, tenantId);
      
      if (roles.length === 0) {
        return false;
      }

      // Get all role IDs (including inherited)
      const allRoleIds = await this.expandRoleHierarchy(roles.map(r => r.roleId));

      // Check if any role has the required permission
      const result = await query(
        `SELECT EXISTS (
          SELECT 1
          FROM role_permissions rp
          JOIN permissions p ON rp.permission_id = p.id
          WHERE rp.role_id = ANY($1)
            AND p.action = $2
            AND p.resource = $3
        ) AS has_permission`,
        [allRoleIds, action, resource]
      );

      const hasPermission = result.rows[0]?.has_permission || false;

      // Audit the access attempt
      await auditService.log({
        tenantId,
        userId,
        action,
        resourceType: resource,
        resourceId,
        details: { allowed: hasPermission },
      });

      return hasPermission;
    } catch (error: any) {
      logger.error('Failed to check permission', { userId, tenantId, action, resource, error: error.message });
      return false;
    }
  }

  /**
   * Get user's roles for a tenant
   */
  async getUserRoles(userId: string, tenantId: string): Promise<UserRole[]> {
    try {
      const result = await query(
        `SELECT user_id, role_id, tenant_id, expires_at
         FROM user_roles
         WHERE user_id = $1
           AND tenant_id = $2
           AND (expires_at IS NULL OR expires_at > NOW())`,
        [userId, tenantId]
      );

      return result.rows.map(row => ({
        userId: row.user_id,
        roleId: row.role_id,
        tenantId: row.tenant_id,
        expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
      }));
    } catch (error: any) {
      logger.error('Failed to get user roles', { userId, tenantId, error: error.message });
      return [];
    }
  }

  /**
   * Expand role hierarchy to include inherited roles
   */
  async expandRoleHierarchy(roleIds: string[]): Promise<string[]> {
    try {
      const result = await query(
        `WITH RECURSIVE role_hierarchy AS (
          -- Base case: start with given roles
          SELECT id, inherits_from
          FROM roles
          WHERE id = ANY($1)
          
          UNION
          
          -- Recursive case: get inherited roles
          SELECT r.id, r.inherits_from
          FROM roles r
          JOIN role_hierarchy rh ON r.id = ANY(rh.inherits_from)
        )
        SELECT DISTINCT id FROM role_hierarchy`,
        [roleIds]
      );

      return result.rows.map(row => row.id);
    } catch (error: any) {
      logger.error('Failed to expand role hierarchy', { roleIds, error: error.message });
      return roleIds; // Fallback to original roles
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(
    userId: string,
    roleId: string,
    tenantId: string,
    assignedBy: string,
    expiresAt?: Date
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO user_roles (user_id, role_id, tenant_id, assigned_by, expires_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, role_id, tenant_id) DO UPDATE
         SET expires_at = EXCLUDED.expires_at,
             assigned_by = EXCLUDED.assigned_by,
             assigned_at = CURRENT_TIMESTAMP`,
        [userId, roleId, tenantId, assignedBy, expiresAt]
      );

      logger.info('Role assigned to user', { userId, roleId, tenantId, assignedBy, expiresAt });

      // Audit the role assignment
      await auditService.log({
        tenantId,
        userId: assignedBy,
        action: 'assign',
        resourceType: 'role',
        resourceId: roleId,
        details: { targetUserId: userId, expiresAt, allowed: true },
      });
    } catch (error: any) {
      logger.error('Failed to assign role', { userId, roleId, tenantId, error: error.message });
      throw error;
    }
  }

  /**
   * Revoke role from user
   */
  async revokeRole(
    userId: string,
    roleId: string,
    tenantId: string,
    revokedBy: string
  ): Promise<void> {
    try {
      await query(
        `DELETE FROM user_roles
         WHERE user_id = $1
           AND role_id = $2
           AND tenant_id = $3`,
        [userId, roleId, tenantId]
      );

      logger.info('Role revoked from user', { userId, roleId, tenantId, revokedBy });

      // Audit the role revocation
      await auditService.log({
        tenantId,
        userId: revokedBy,
        action: 'revoke',
        resourceType: 'role',
        resourceId: roleId,
        details: { targetUserId: userId, allowed: true },
      });
    } catch (error: any) {
      logger.error('Failed to revoke role', { userId, roleId, tenantId, error: error.message });
      throw error;
    }
  }

  /**
   * Get all roles
   */
  async getRoles(): Promise<Role[]> {
    try {
      const result = await query(
        `SELECT id, name, inherits_from, description, is_system
         FROM roles
         ORDER BY name`
      );

      return result.rows.map(row => ({
        id: row.id,
        name: row.name,
        inheritsFrom: row.inherits_from || [],
        description: row.description,
        isSystem: row.is_system,
      }));
    } catch (error: any) {
      logger.error('Failed to get roles', { error: error.message });
      return [];
    }
  }

  /**
   * Get role by ID
   */
  async getRoleById(roleId: string): Promise<Role | null> {
    try {
      const result = await query(
        `SELECT id, name, inherits_from, description, is_system
         FROM roles
         WHERE id = $1`,
        [roleId]
      );

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        name: row.name,
        inheritsFrom: row.inherits_from || [],
        description: row.description,
        isSystem: row.is_system,
      };
    } catch (error: any) {
      logger.error('Failed to get role by ID', { roleId, error: error.message });
      return null;
    }
  }

  /**
   * Get permissions for a role
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    try {
      const result = await query(
        `SELECT p.id, p.action, p.resource, p.condition, p.description
         FROM permissions p
         JOIN role_permissions rp ON p.id = rp.permission_id
         WHERE rp.role_id = $1
         ORDER BY p.resource, p.action`,
        [roleId]
      );

      return result.rows.map(row => ({
        id: row.id,
        action: row.action,
        resource: row.resource,
        condition: row.condition,
        description: row.description,
      }));
    } catch (error: any) {
      logger.error('Failed to get role permissions', { roleId, error: error.message });
      return [];
    }
  }

  /**
   * Create a new role
   */
  async createRole(
    name: string,
    description: string,
    inheritsFrom: string[] = [],
    createdBy: string
  ): Promise<Role> {
    try {
      const result = await query(
        `INSERT INTO roles (name, description, inherits_from, is_system)
         VALUES ($1, $2, $3, FALSE)
         RETURNING id, name, inherits_from, description, is_system`,
        [name, description, inheritsFrom]
      );

      const row = result.rows[0];
      const role: Role = {
        id: row.id,
        name: row.name,
        inheritsFrom: row.inherits_from || [],
        description: row.description,
        isSystem: row.is_system,
      };

      logger.info('Role created', { roleId: role.id, name, createdBy });

      return role;
    } catch (error: any) {
      logger.error('Failed to create role', { name, error: error.message });
      throw error;
    }
  }
}

export const rbacService = new RBACService();

