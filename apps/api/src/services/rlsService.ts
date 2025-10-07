/**
 * Row-Level Security (RLS) Service
 * Story 3.1: Role-Based Access Control
 *
 * Service for applying row-level security policies to queries.
 */

import { query } from '../database/connection.js';
import { logger } from '../logger/logger.js';

/**
 * RLS Policy interface
 */
export interface RLSPolicy {
  id: string;
  tenantId: string;
  name: string;
  tableName: string;
  predicateSql: string;
  appliesTo: string[]; // Role IDs
  isActive: boolean;
  priority: number;
}

/**
 * User context for RLS
 */
export interface UserContext {
  userId: string;
  tenantId: string;
  roleIds: string[];
  attributes?: Record<string, any>; // User attributes (department, region, etc.)
}

/**
 * Legacy interface for backward compatibility
 */
export interface UserClaims {
  tenantId: string;
  department?: string | null;
  region?: string | null;
}

export interface RlsResult {
  sql: string;
  params: any[];
}

/**
 * RLS Service Class
 */
export class RLSService {
  /**
   * Apply RLS policies to a query
   */
  async applyRLS(
    tableName: string,
    userContext: UserContext,
    baseWhere?: string
  ): Promise<string> {
    try {
      // Get applicable RLS policies for the table and user's roles
      const policies = await this.getApplicablePolicies(tableName, userContext);

      if (policies.length === 0) {
        // No RLS policies, return base WHERE clause
        return baseWhere || '1=1';
      }

      // Build RLS predicates
      const rlsPredicates = policies.map(policy => {
        return this.interpolatePredicateVariables(policy.predicateSql, userContext);
      });

      // Combine RLS predicates with AND (all policies must be satisfied)
      const rlsClause = rlsPredicates.map(p => `(${p})`).join(' AND ');

      // Combine with base WHERE clause
      if (baseWhere) {
        return `(${baseWhere}) AND (${rlsClause})`;
      }

      return rlsClause;
    } catch (error: any) {
      logger.error('Failed to apply RLS', { tableName, userContext, error: error.message });
      // Fail-safe: deny all access if RLS fails
      return '1=0';
    }
  }

  /**
   * Get applicable RLS policies for a table and user
   */
  private async getApplicablePolicies(
    tableName: string,
    userContext: UserContext
  ): Promise<RLSPolicy[]> {
    try {
      const result = await query(
        `SELECT id, tenant_id, name, table_name, predicate_sql, applies_to, is_active, priority
         FROM rls_policies
         WHERE tenant_id = $1
           AND table_name = $2
           AND is_active = TRUE
           AND applies_to && $3
         ORDER BY priority DESC`,
        [userContext.tenantId, tableName, userContext.roleIds]
      );

      return result.rows.map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        tableName: row.table_name,
        predicateSql: row.predicate_sql,
        appliesTo: row.applies_to,
        isActive: row.is_active,
        priority: row.priority,
      }));
    } catch (error: any) {
      logger.error('Failed to get applicable RLS policies', { tableName, userContext, error: error.message });
      return [];
    }
  }

  /**
   * Interpolate variables in RLS predicate
   *
   * Supported variables:
   * - :user_id -> User ID
   * - :tenant_id -> Tenant ID
   * - :user_department -> User's department attribute
   * - :user_region -> User's region attribute
   * - etc.
   */
  private interpolatePredicateVariables(
    predicateSql: string,
    userContext: UserContext
  ): string {
    let interpolated = predicateSql;

    // Replace :user_id
    interpolated = interpolated.replace(/:user_id/g, `'${userContext.userId}'`);

    // Replace :tenant_id
    interpolated = interpolated.replace(/:tenant_id/g, `'${userContext.tenantId}'`);

    // Replace user attributes
    if (userContext.attributes) {
      Object.entries(userContext.attributes).forEach(([key, value]) => {
        const placeholder = `:user_${key}`;
        const escapedValue = typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : value;
        interpolated = interpolated.replace(new RegExp(placeholder, 'g'), String(escapedValue));
      });
    }

    return interpolated;
  }

  /**
   * Create RLS policy
   */
  async createPolicy(
    tenantId: string,
    name: string,
    tableName: string,
    predicateSql: string,
    appliesTo: string[],
    priority: number = 0,
    createdBy: string
  ): Promise<RLSPolicy> {
    try {
      const result = await query(
        `INSERT INTO rls_policies (tenant_id, name, table_name, predicate_sql, applies_to, priority, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, tenant_id, name, table_name, predicate_sql, applies_to, is_active, priority`,
        [tenantId, name, tableName, predicateSql, appliesTo, priority, createdBy]
      );

      const row = result.rows[0];
      const policy: RLSPolicy = {
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        tableName: row.table_name,
        predicateSql: row.predicate_sql,
        appliesTo: row.applies_to,
        isActive: row.is_active,
        priority: row.priority,
      };

      logger.info('RLS policy created', { policyId: policy.id, name, tableName, createdBy });

      return policy;
    } catch (error: any) {
      logger.error('Failed to create RLS policy', { name, tableName, error: error.message });
      throw error;
    }
  }

  /**
   * Update RLS policy
   */
  async updatePolicy(
    policyId: string,
    updates: Partial<Omit<RLSPolicy, 'id' | 'tenantId'>>
  ): Promise<void> {
    try {
      const setClauses: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.name !== undefined) {
        setClauses.push(`name = $${paramIndex++}`);
        values.push(updates.name);
      }

      if (updates.predicateSql !== undefined) {
        setClauses.push(`predicate_sql = $${paramIndex++}`);
        values.push(updates.predicateSql);
      }

      if (updates.appliesTo !== undefined) {
        setClauses.push(`applies_to = $${paramIndex++}`);
        values.push(updates.appliesTo);
      }

      if (updates.isActive !== undefined) {
        setClauses.push(`is_active = $${paramIndex++}`);
        values.push(updates.isActive);
      }

      if (updates.priority !== undefined) {
        setClauses.push(`priority = $${paramIndex++}`);
        values.push(updates.priority);
      }

      if (setClauses.length === 0) {
        return;
      }

      values.push(policyId);

      await query(
        `UPDATE rls_policies
         SET ${setClauses.join(', ')}, updated_at = CURRENT_TIMESTAMP
         WHERE id = $${paramIndex}`,
        values
      );

      logger.info('RLS policy updated', { policyId, updates });
    } catch (error: any) {
      logger.error('Failed to update RLS policy', { policyId, error: error.message });
      throw error;
    }
  }

  /**
   * Delete RLS policy
   */
  async deletePolicy(policyId: string): Promise<void> {
    try {
      await query(
        `DELETE FROM rls_policies WHERE id = $1`,
        [policyId]
      );

      logger.info('RLS policy deleted', { policyId });
    } catch (error: any) {
      logger.error('Failed to delete RLS policy', { policyId, error: error.message });
      throw error;
    }
  }

  /**
   * Get all RLS policies for a tenant
   */
  async getPolicies(tenantId: string, tableName?: string): Promise<RLSPolicy[]> {
    try {
      const sql = tableName
        ? `SELECT id, tenant_id, name, table_name, predicate_sql, applies_to, is_active, priority
           FROM rls_policies
           WHERE tenant_id = $1 AND table_name = $2
           ORDER BY priority DESC, name`
        : `SELECT id, tenant_id, name, table_name, predicate_sql, applies_to, is_active, priority
           FROM rls_policies
           WHERE tenant_id = $1
           ORDER BY table_name, priority DESC, name`;

      const params = tableName ? [tenantId, tableName] : [tenantId];
      const result = await query(sql, params);

      return result.rows.map(row => ({
        id: row.id,
        tenantId: row.tenant_id,
        name: row.name,
        tableName: row.table_name,
        predicateSql: row.predicate_sql,
        appliesTo: row.applies_to,
        isActive: row.is_active,
        priority: row.priority,
      }));
    } catch (error: any) {
      logger.error('Failed to get RLS policies', { tenantId, tableName, error: error.message });
      return [];
    }
  }

  /**
   * Back-compat helper: apply RLS to arbitrary SQL by wrapping it
   */
  async apply(tenantId: string, userClaims: UserClaims, sql: string, params: any[]): Promise<RlsResult> {
    // Legacy claims -> minimal user context (no roles available here)
    const userContext: UserContext = {
      userId: 'unknown',
      tenantId,
      roleIds: [],
      attributes: {
        department: userClaims.department ?? null,
        region: userClaims.region ?? null,
      },
    };
    const rlsWhere = await this.applyRLS('unknown_table', userContext, '1=1');
    const wrapped = `SELECT * FROM (${sql}) AS sub WHERE ${rlsWhere}`;
    return { sql: wrapped, params };
  }

}

export const rlsService = new RLSService();
