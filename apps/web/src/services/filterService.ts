/**
 * Filter Service
 * Story 2.3: Advanced Filtering & Cross-Filtering
 * 
 * Frontend service for filter API operations.
 */

import apiClient from './apiClient';

/**
 * Filter operators (matching backend)
 */
export enum FilterOperator {
  EQ = 'eq',
  NEQ = 'neq',
  GT = 'gt',
  GTE = 'gte',
  LT = 'lt',
  LTE = 'lte',
  BETWEEN = 'between',
  IN = 'in',
  NOT_IN = 'not_in',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  REGEX = 'regex',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
  IS_TRUE = 'is_true',
  IS_FALSE = 'is_false',
}

/**
 * Logical operators
 */
export enum LogicalOperator {
  AND = 'and',
  OR = 'or',
}

/**
 * Filter predicate
 */
export interface FilterPredicate {
  field: string;
  operator: FilterOperator;
  value?: any;
  values?: any[];
  range?: { min: any; max: any };
  caseSensitive?: boolean;
}

/**
 * Filter group
 */
export interface FilterGroup {
  operator: LogicalOperator;
  predicates: (FilterPredicate | FilterGroup)[];
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  operator?: LogicalOperator;
  predicates: (FilterPredicate | FilterGroup)[];
}

/**
 * Filter evaluation request
 */
export interface FilterEvaluationRequest {
  dashboardId?: string;
  dataSourceId?: string;
  tableName?: string;
  filter: FilterConfig;
  options?: {
    limit?: number;
    offset?: number;
    useCache?: boolean;
  };
}

/**
 * Filter evaluation result
 */
export interface FilterEvaluationResult {
  success: boolean;
  rowCount?: number;
  data?: any[];
  sql?: string;
  predicateHash?: string;
  cached?: boolean;
  durationMs?: number;
  error?: string;
}

/**
 * Saved filter set
 */
export interface FilterSet {
  id: string;
  tenantId: string;
  dashboardId?: string;
  name: string;
  description?: string;
  predicates: FilterConfig;
  isGlobal: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create filter set request
 */
export interface CreateFilterSetRequest {
  dashboardId?: string;
  name: string;
  description?: string;
  predicates: FilterConfig;
  isGlobal?: boolean;
}

/**
 * Update filter set request
 */
export interface UpdateFilterSetRequest {
  name?: string;
  description?: string;
  predicates?: FilterConfig;
  isGlobal?: boolean;
}

/**
 * List filter sets params
 */
export interface ListFilterSetsParams {
  dashboardId?: string;
  isGlobal?: boolean;
  limit?: number;
  offset?: number;
}

/**
 * List filter sets response
 */
export interface ListFilterSetsResponse {
  items: FilterSet[];
  total: number;
}

/**
 * Filter Service Class
 */
class FilterService {
  /**
   * Evaluate a filter configuration
   */
  async evaluateFilter(request: FilterEvaluationRequest): Promise<FilterEvaluationResult> {
    try {
      const response = await apiClient.post<FilterEvaluationResult>('/filters/evaluate', request);
      return response.data;
    } catch (error: any) {
      console.error('Failed to evaluate filter:', error);
      throw new Error(error.response?.data?.error || 'Failed to evaluate filter');
    }
  }

  /**
   * Create a new filter set
   */
  async createFilterSet(request: CreateFilterSetRequest): Promise<FilterSet> {
    try {
      const response = await apiClient.post<FilterSet>('/filters/filter-sets', request);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create filter set:', error);
      throw new Error(error.response?.data?.error || 'Failed to create filter set');
    }
  }

  /**
   * Get a filter set by ID
   */
  async getFilterSet(id: string): Promise<FilterSet> {
    try {
      const response = await apiClient.get<FilterSet>(`/filters/filter-sets/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to get filter set:', error);
      throw new Error(error.response?.data?.error || 'Failed to get filter set');
    }
  }

  /**
   * List filter sets
   */
  async listFilterSets(params?: ListFilterSetsParams): Promise<ListFilterSetsResponse> {
    try {
      const response = await apiClient.get<ListFilterSetsResponse>('/filters/filter-sets', {
        params,
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to list filter sets:', error);
      throw new Error(error.response?.data?.error || 'Failed to list filter sets');
    }
  }

  /**
   * Update a filter set
   */
  async updateFilterSet(id: string, request: UpdateFilterSetRequest): Promise<FilterSet> {
    try {
      const response = await apiClient.put<FilterSet>(`/filters/filter-sets/${id}`, request);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update filter set:', error);
      throw new Error(error.response?.data?.error || 'Failed to update filter set');
    }
  }

  /**
   * Delete a filter set
   */
  async deleteFilterSet(id: string): Promise<void> {
    try {
      await apiClient.delete(`/filters/filter-sets/${id}`);
    } catch (error: any) {
      console.error('Failed to delete filter set:', error);
      throw new Error(error.response?.data?.error || 'Failed to delete filter set');
    }
  }

  /**
   * Get operator display name
   */
  getOperatorDisplayName(operator: FilterOperator): string {
    const displayNames: Record<FilterOperator, string> = {
      [FilterOperator.EQ]: 'Equals',
      [FilterOperator.NEQ]: 'Not Equals',
      [FilterOperator.GT]: 'Greater Than',
      [FilterOperator.GTE]: 'Greater Than or Equal',
      [FilterOperator.LT]: 'Less Than',
      [FilterOperator.LTE]: 'Less Than or Equal',
      [FilterOperator.BETWEEN]: 'Between',
      [FilterOperator.IN]: 'In',
      [FilterOperator.NOT_IN]: 'Not In',
      [FilterOperator.CONTAINS]: 'Contains',
      [FilterOperator.NOT_CONTAINS]: 'Does Not Contain',
      [FilterOperator.STARTS_WITH]: 'Starts With',
      [FilterOperator.ENDS_WITH]: 'Ends With',
      [FilterOperator.REGEX]: 'Matches Regex',
      [FilterOperator.IS_NULL]: 'Is Null',
      [FilterOperator.IS_NOT_NULL]: 'Is Not Null',
      [FilterOperator.IS_TRUE]: 'Is True',
      [FilterOperator.IS_FALSE]: 'Is False',
    };
    return displayNames[operator] || operator;
  }

  /**
   * Get operators for data type
   */
  getOperatorsForType(dataType: 'string' | 'number' | 'date' | 'boolean'): FilterOperator[] {
    switch (dataType) {
      case 'string':
        return [
          FilterOperator.EQ,
          FilterOperator.NEQ,
          FilterOperator.CONTAINS,
          FilterOperator.NOT_CONTAINS,
          FilterOperator.STARTS_WITH,
          FilterOperator.ENDS_WITH,
          FilterOperator.REGEX,
          FilterOperator.IN,
          FilterOperator.NOT_IN,
          FilterOperator.IS_NULL,
          FilterOperator.IS_NOT_NULL,
        ];
      case 'number':
        return [
          FilterOperator.EQ,
          FilterOperator.NEQ,
          FilterOperator.GT,
          FilterOperator.GTE,
          FilterOperator.LT,
          FilterOperator.LTE,
          FilterOperator.BETWEEN,
          FilterOperator.IN,
          FilterOperator.NOT_IN,
          FilterOperator.IS_NULL,
          FilterOperator.IS_NOT_NULL,
        ];
      case 'date':
        return [
          FilterOperator.EQ,
          FilterOperator.NEQ,
          FilterOperator.GT,
          FilterOperator.GTE,
          FilterOperator.LT,
          FilterOperator.LTE,
          FilterOperator.BETWEEN,
          FilterOperator.IS_NULL,
          FilterOperator.IS_NOT_NULL,
        ];
      case 'boolean':
        return [
          FilterOperator.EQ,
          FilterOperator.IS_TRUE,
          FilterOperator.IS_FALSE,
          FilterOperator.IS_NULL,
          FilterOperator.IS_NOT_NULL,
        ];
      default:
        return Object.values(FilterOperator);
    }
  }
}

export const filterService = new FilterService();
export default filterService;

