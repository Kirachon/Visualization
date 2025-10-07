/**
 * Filter Evaluation Service
 * Story 2.3: Advanced Filtering & Cross-Filtering
 * 
 * Handles filter predicate evaluation, SQL generation, caching, and security validation.
 */

import crypto from 'crypto';
import { query } from '../database/connection.js';
import { logger } from '../logger/logger.js';
import {
  FilterConfig,
  FilterPredicate,
  FilterGroup,
  FilterOperator,
  LogicalOperator,
  FilterEvaluationRequest,
  FilterEvaluationResult,
} from '../types/filter.js';

/**
 * Cache for filter evaluation results
 * Key: predicate hash
 * Value: { result, timestamp }
 */
const filterCache = new Map<string, { result: any; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds
const MAX_CACHE_ENTRIES = 100;

/**
 * Security limits
 */
const MAX_PREDICATE_DEPTH = 5;
const MAX_REGEX_LENGTH = 200;
const MAX_IN_VALUES = 1000;

export class FilterEvaluationService {
  /**
   * Evaluate a filter configuration
   */
  async evaluate(request: FilterEvaluationRequest, tenantId: string): Promise<FilterEvaluationResult> {
    const startTime = Date.now();
    
    try {
      // Validate filter configuration
      this.validateFilter(request.filter);
      
      // Generate predicate hash for caching
      const predicateHash = this.hashPredicate(request.filter);
      
      // Check cache if enabled
      if (request.options?.useCache !== false) {
        const cached = this.getFromCache(predicateHash);
        if (cached) {
          logger.debug('Filter cache hit', { predicateHash });
          return {
            success: true,
            ...cached,
            cached: true,
            predicateHash,
            durationMs: Date.now() - startTime,
          };
        }
      }
      
      // Build SQL WHERE clause
      const { sql, params } = this.buildWhereClause(request.filter);
      
      // Execute query (simplified - in production, this would query the actual data source)
      const result = await this.executeFilterQuery(
        request.dataSourceId || '',
        request.tableName || '',
        sql,
        params,
        request.options?.limit,
        request.options?.offset
      );
      
      // Cache result
      if (request.options?.useCache !== false) {
        this.setCache(predicateHash, result);
      }
      
      // Record metrics
      await this.recordMetrics(tenantId, request.dashboardId, predicateHash, Date.now() - startTime, false, result.rowCount);
      
      return {
        success: true,
        ...result,
        sql,
        predicateHash,
        cached: false,
        durationMs: Date.now() - startTime,
      };
    } catch (error: any) {
      logger.error('Filter evaluation failed', { error: error.message, request });
      
      // Record error metrics
      await this.recordMetrics(tenantId, request.dashboardId, '', Date.now() - startTime, false, 0, error.message);
      
      return {
        success: false,
        error: error.message,
        durationMs: Date.now() - startTime,
      };
    }
  }
  
  /**
   * Validate filter configuration
   */
  private validateFilter(filter: FilterConfig, depth: number = 0): void {
    if (depth > MAX_PREDICATE_DEPTH) {
      throw new Error(`Filter depth exceeds maximum of ${MAX_PREDICATE_DEPTH}`);
    }
    
    if (!filter.predicates || !Array.isArray(filter.predicates)) {
      throw new Error('Filter predicates must be an array');
    }
    
    for (const item of filter.predicates) {
      if (this.isFilterGroup(item)) {
        this.validateFilter(item as FilterGroup, depth + 1);
      } else {
        this.validatePredicate(item as FilterPredicate);
      }
    }
  }
  
  /**
   * Validate a single predicate
   */
  private validatePredicate(predicate: FilterPredicate): void {
    if (!predicate.field || typeof predicate.field !== 'string') {
      throw new Error('Predicate field is required and must be a string');
    }
    
    // Prevent SQL injection - only allow alphanumeric, underscore, and dot
    if (!/^[a-zA-Z0-9_.]+$/.test(predicate.field)) {
      throw new Error(`Invalid field name: ${predicate.field}`);
    }
    
    if (!Object.values(FilterOperator).includes(predicate.operator)) {
      throw new Error(`Invalid operator: ${predicate.operator}`);
    }
    
    // Validate operator-specific requirements
    switch (predicate.operator) {
      case FilterOperator.IN:
      case FilterOperator.NOT_IN:
        if (!Array.isArray(predicate.values) || predicate.values.length === 0) {
          throw new Error(`Operator ${predicate.operator} requires non-empty values array`);
        }
        if (predicate.values.length > MAX_IN_VALUES) {
          throw new Error(`IN operator values exceed maximum of ${MAX_IN_VALUES}`);
        }
        break;
        
      case FilterOperator.BETWEEN:
        if (!predicate.range || predicate.range.min === undefined || predicate.range.max === undefined) {
          throw new Error('BETWEEN operator requires range with min and max');
        }
        break;
        
      case FilterOperator.REGEX:
        if (typeof predicate.value !== 'string') {
          throw new Error('REGEX operator requires string value');
        }
        if (predicate.value.length > MAX_REGEX_LENGTH) {
          throw new Error(`Regex pattern exceeds maximum length of ${MAX_REGEX_LENGTH}`);
        }
        // Validate regex pattern
        try {
          new RegExp(predicate.value);
        } catch (e) {
          throw new Error('Invalid regex pattern');
        }
        break;
        
      case FilterOperator.IS_NULL:
      case FilterOperator.IS_NOT_NULL:
      case FilterOperator.IS_TRUE:
      case FilterOperator.IS_FALSE:
        // These operators don't require values
        break;
        
      default:
        // All other operators require a value
        if (predicate.value === undefined && !predicate.values && !predicate.range) {
          throw new Error(`Operator ${predicate.operator} requires a value`);
        }
    }
  }
  
  /**
   * Check if item is a filter group
   */
  private isFilterGroup(item: any): boolean {
    return item.operator && item.predicates && Array.isArray(item.predicates);
  }
  
  /**
   * Build SQL WHERE clause from filter configuration
   */
  private buildWhereClause(filter: FilterConfig): { sql: string; params: any[] } {
    const params: any[] = [];
    const sqlInner = this.buildWhereClauseInternal(filter, params, true);
    const shouldWrap = (filter.predicates?.length || 0) > 1 && !!sqlInner;
    return {
      sql: shouldWrap ? `(${sqlInner})` : sqlInner,
      params,
    };
  }

  /**
   * Internal recursive builder that appends to shared params array so parameter indexes increment globally
   */
  private buildWhereClauseInternal(node: FilterConfig | FilterGroup, params: any[], isRoot = false): string {
    const operator = (node as any).operator || LogicalOperator.AND;
    const parts: string[] = [];

    for (const item of (node as any).predicates as Array<FilterPredicate | FilterGroup>) {
      if (this.isFilterGroup(item)) {
        const inner = this.buildWhereClauseInternal(item as FilterGroup, params, false);
        if (inner) parts.push(inner);
      } else {
        const clause = this.buildPredicateClause(item as FilterPredicate, params);
        if (clause) parts.push(clause);
      }
    }

    const joined = parts.join(` ${operator.toUpperCase()} `);
    if (!joined) return '';
    // Only wrap in parentheses when not root and there are multiple parts
    return !isRoot && parts.length > 1 ? `(${joined})` : joined;
  }

  /**
   * Build SQL clause for a single predicate, appending values into shared params
   */
  private buildPredicateClause(predicate: FilterPredicate, params: any[]): string {
    const field = predicate.field;
    let sql = '';

    switch (predicate.operator) {
      case FilterOperator.EQ:
        sql = `${field} = $${params.length + 1}`;
        params.push(predicate.value);
        break;

      case FilterOperator.NEQ:
        sql = `${field} != $${params.length + 1}`;
        params.push(predicate.value);
        break;

      case FilterOperator.GT:
        sql = `${field} > $${params.length + 1}`;
        params.push(predicate.value);
        break;

      case FilterOperator.GTE:
        sql = `${field} >= $${params.length + 1}`;
        params.push(predicate.value);
        break;

      case FilterOperator.LT:
        sql = `${field} < $${params.length + 1}`;
        params.push(predicate.value);
        break;

      case FilterOperator.LTE:
        sql = `${field} <= $${params.length + 1}`;
        params.push(predicate.value);
        break;

      case FilterOperator.BETWEEN:
        sql = `${field} BETWEEN $${params.length + 1} AND $${params.length + 2}`;
        params.push(predicate.range!.min, predicate.range!.max);
        break;

      case FilterOperator.IN: {
        const inPlaceholders = predicate.values!.map((_, i) => `$${params.length + i + 1}`).join(', ');
        sql = `${field} IN (${inPlaceholders})`;
        params.push(...predicate.values!);
        break;
      }

      case FilterOperator.NOT_IN: {
        const notInPlaceholders = predicate.values!.map((_, i) => `$${params.length + i + 1}`).join(', ');
        sql = `${field} NOT IN (${notInPlaceholders})`;
        params.push(...predicate.values!);
        break;
      }

      case FilterOperator.CONTAINS:
        sql = predicate.caseSensitive
          ? `${field} LIKE $${params.length + 1}`
          : `LOWER(${field}) LIKE LOWER($${params.length + 1})`;
        params.push(`%${predicate.value}%`);
        break;

      case FilterOperator.NOT_CONTAINS:
        sql = predicate.caseSensitive
          ? `${field} NOT LIKE $${params.length + 1}`
          : `LOWER(${field}) NOT LIKE LOWER($${params.length + 1})`;
        params.push(`%${predicate.value}%`);
        break;

      case FilterOperator.STARTS_WITH:
        sql = predicate.caseSensitive
          ? `${field} LIKE $${params.length + 1}`
          : `LOWER(${field}) LIKE LOWER($${params.length + 1})`;
        params.push(`${predicate.value}%`);
        break;

      case FilterOperator.ENDS_WITH:
        sql = predicate.caseSensitive
          ? `${field} LIKE $${params.length + 1}`
          : `LOWER(${field}) LIKE LOWER($${params.length + 1})`;
        params.push(`%${predicate.value}`);
        break;

      case FilterOperator.REGEX:
        sql = `${field} ~ $${params.length + 1}`;
        params.push(predicate.value);
        break;

      case FilterOperator.IS_NULL:
        sql = `${field} IS NULL`;
        break;

      case FilterOperator.IS_NOT_NULL:
        sql = `${field} IS NOT NULL`;
        break;

      case FilterOperator.IS_TRUE:
        sql = `${field} = TRUE`;
        break;

      case FilterOperator.IS_FALSE:
        sql = `${field} = FALSE`;
        break;
    }

    return sql;
  }
  
  /**
   * Execute filter query (simplified version)
   * In production, this would query the actual data source
   */
  private async executeFilterQuery(
    _dataSourceId: string,
    _tableName: string,
    _whereClause: string,
    _params: any[],
    _limit?: number,
    _offset?: number
  ): Promise<{ rowCount: number; data?: any[] }> {
    // This is a simplified implementation
    // In production, this would:
    // 1. Get data source connection details
    // 2. Connect to the data source
    // 3. Execute the query with the WHERE clause
    // 4. Return the results
    
    // For now, return mock data
    return {
      rowCount: 0,
      data: [],
    };
  }
  
  /**
   * Generate hash for predicate (for caching)
   */
  private hashPredicate(filter: FilterConfig): string {
    const str = JSON.stringify(filter);
    return crypto.createHash('sha256').update(str).digest('hex');
  }
  
  /**
   * Get result from cache
   */
  private getFromCache(hash: string): any | null {
    const cached = filterCache.get(hash);
    if (!cached) return null;
    
    // Check if cache entry is still valid
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
      filterCache.delete(hash);
      return null;
    }
    
    return cached.result;
  }
  
  /**
   * Set result in cache
   */
  private setCache(hash: string, result: any): void {
    // Implement LRU eviction if cache is full
    if (filterCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = filterCache.keys().next().value as string | undefined;
      if (oldestKey !== undefined) {
        filterCache.delete(oldestKey);
      }
    }
    
    filterCache.set(hash, {
      result,
      timestamp: Date.now(),
    });
  }
  
  /**
   * Record filter metrics
   */
  private async recordMetrics(
    tenantId: string,
    dashboardId: string | undefined,
    predicateHash: string,
    durationMs: number,
    cacheHit: boolean,
    rowCount?: number,
    errorMessage?: string
  ): Promise<void> {
    try {
      await query(
        `INSERT INTO filter_metrics (tenant_id, dashboard_id, predicate_hash, duration_ms, cache_hit, row_count, error_message)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [tenantId, dashboardId || null, predicateHash, durationMs, cacheHit, rowCount || null, errorMessage || null]
      );
    } catch (error: any) {
      logger.error('Failed to record filter metrics', { error: error.message });
    }
  }
}

export const filterEvaluationService = new FilterEvaluationService();

