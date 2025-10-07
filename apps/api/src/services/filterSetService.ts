/**
 * Filter Set Service
 * Story 2.3: Advanced Filtering & Cross-Filtering
 * 
 * Manages saved filter sets (CRUD operations).
 */

import { query } from '../database/connection.js';
import { logger } from '../logger/logger.js';
import { FilterConfig, FilterSet } from '../types/filter.js';

export interface CreateFilterSetRequest {
  dashboardId?: string;
  name: string;
  description?: string;
  predicates: FilterConfig;
  isGlobal?: boolean;
}

export interface UpdateFilterSetRequest {
  name?: string;
  description?: string;
  predicates?: FilterConfig;
  isGlobal?: boolean;
}

export interface ListFilterSetsParams {
  dashboardId?: string;
  isGlobal?: boolean;
  limit?: number;
  offset?: number;
}

export class FilterSetService {
  /**
   * Create a new filter set
   */
  async create(request: CreateFilterSetRequest, tenantId: string, userId: string): Promise<FilterSet> {
    try {
      const result = await query(
        `INSERT INTO filter_sets (tenant_id, dashboard_id, name, description, predicates, is_global, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          tenantId,
          request.dashboardId || null,
          request.name,
          request.description || null,
          JSON.stringify(request.predicates),
          request.isGlobal || false,
          userId,
        ]
      );
      
      logger.info('Filter set created', { id: result.rows[0].id, name: request.name });
      return this.mapToFilterSet(result.rows[0]);
    } catch (error: any) {
      logger.error('Failed to create filter set', { error: error.message, request });
      throw new Error(`Failed to create filter set: ${error.message}`);
    }
  }
  
  /**
   * Get a filter set by ID
   */
  async getById(id: string, tenantId: string): Promise<FilterSet | null> {
    try {
      const result = await query(
        `SELECT * FROM filter_sets WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
      );
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapToFilterSet(result.rows[0]);
    } catch (error: any) {
      logger.error('Failed to get filter set', { error: error.message, id });
      throw new Error(`Failed to get filter set: ${error.message}`);
    }
  }
  
  /**
   * List filter sets
   */
  async list(params: ListFilterSetsParams, tenantId: string): Promise<{ items: FilterSet[]; total: number }> {
    try {
      const conditions: string[] = ['tenant_id = $1'];
      const values: any[] = [tenantId];
      let paramIndex = 2;
      
      if (params.dashboardId) {
        conditions.push(`dashboard_id = $${paramIndex}`);
        values.push(params.dashboardId);
        paramIndex++;
      }
      
      if (params.isGlobal !== undefined) {
        conditions.push(`is_global = $${paramIndex}`);
        values.push(params.isGlobal);
        paramIndex++;
      }
      
      const whereClause = conditions.join(' AND ');
      
      // Get total count
      const countResult = await query(
        `SELECT COUNT(*) FROM filter_sets WHERE ${whereClause}`,
        values
      );
      const total = parseInt(countResult.rows[0].count);
      
      // Get items
      const limit = params.limit || 50;
      const offset = params.offset || 0;
      
      const result = await query(
        `SELECT * FROM filter_sets 
         WHERE ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
        [...values, limit, offset]
      );
      
      const items = result.rows.map(row => this.mapToFilterSet(row));
      
      return { items, total };
    } catch (error: any) {
      logger.error('Failed to list filter sets', { error: error.message, params });
      throw new Error(`Failed to list filter sets: ${error.message}`);
    }
  }
  
  /**
   * Update a filter set
   */
  async update(id: string, request: UpdateFilterSetRequest, tenantId: string): Promise<FilterSet> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (request.name !== undefined) {
        updates.push(`name = $${paramIndex}`);
        values.push(request.name);
        paramIndex++;
      }
      
      if (request.description !== undefined) {
        updates.push(`description = $${paramIndex}`);
        values.push(request.description);
        paramIndex++;
      }
      
      if (request.predicates !== undefined) {
        updates.push(`predicates = $${paramIndex}`);
        values.push(JSON.stringify(request.predicates));
        paramIndex++;
      }
      
      if (request.isGlobal !== undefined) {
        updates.push(`is_global = $${paramIndex}`);
        values.push(request.isGlobal);
        paramIndex++;
      }
      
      if (updates.length === 0) {
        throw new Error('No fields to update');
      }
      
      values.push(id, tenantId);
      
      const result = await query(
        `UPDATE filter_sets 
         SET ${updates.join(', ')}
         WHERE id = $${paramIndex} AND tenant_id = $${paramIndex + 1}
         RETURNING *`,
        values
      );
      
      if (result.rows.length === 0) {
        throw new Error('Filter set not found');
      }
      
      logger.info('Filter set updated', { id });
      return this.mapToFilterSet(result.rows[0]);
    } catch (error: any) {
      logger.error('Failed to update filter set', { error: error.message, id, request });
      throw new Error(`Failed to update filter set: ${error.message}`);
    }
  }
  
  /**
   * Delete a filter set
   */
  async delete(id: string, tenantId: string): Promise<void> {
    try {
      const result = await query(
        `DELETE FROM filter_sets WHERE id = $1 AND tenant_id = $2`,
        [id, tenantId]
      );
      
      if (result.rowCount === 0) {
        throw new Error('Filter set not found');
      }
      
      logger.info('Filter set deleted', { id });
    } catch (error: any) {
      logger.error('Failed to delete filter set', { error: error.message, id });
      throw new Error(`Failed to delete filter set: ${error.message}`);
    }
  }
  
  /**
   * Map database row to FilterSet
   */
  private mapToFilterSet(row: any): FilterSet {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      dashboardId: row.dashboard_id,
      name: row.name,
      description: row.description,
      predicates: typeof row.predicates === 'string' ? JSON.parse(row.predicates) : row.predicates,
      isGlobal: row.is_global,
      createdBy: row.created_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const filterSetService = new FilterSetService();

