/**
 * Filter Types and Interfaces
 * Story 2.3: Advanced Filtering & Cross-Filtering
 */

/**
 * Supported filter operators
 */
export enum FilterOperator {
  // Equality
  EQ = 'eq',           // Equal
  NEQ = 'neq',         // Not equal
  
  // Comparison
  GT = 'gt',           // Greater than
  GTE = 'gte',         // Greater than or equal
  LT = 'lt',           // Less than
  LTE = 'lte',         // Less than or equal
  
  // Range
  BETWEEN = 'between', // Between two values (inclusive)
  
  // Set operations
  IN = 'in',           // In array of values
  NOT_IN = 'not_in',   // Not in array of values
  
  // String operations
  CONTAINS = 'contains',       // Contains substring (case-insensitive)
  NOT_CONTAINS = 'not_contains', // Does not contain substring
  STARTS_WITH = 'starts_with', // Starts with prefix
  ENDS_WITH = 'ends_with',     // Ends with suffix
  REGEX = 'regex',             // Matches regular expression
  
  // Null checks
  IS_NULL = 'is_null',         // Is null
  IS_NOT_NULL = 'is_not_null', // Is not null
  
  // Boolean
  IS_TRUE = 'is_true',         // Is true
  IS_FALSE = 'is_false',       // Is false
}

/**
 * Logical operators for combining predicates
 */
export enum LogicalOperator {
  AND = 'and',
  OR = 'or',
}

/**
 * Filter predicate for a single condition
 */
export interface FilterPredicate {
  field: string;
  operator: FilterOperator;
  value?: any;                    // Single value for eq, neq, gt, lt, etc.
  values?: any[];                 // Array of values for in, not_in
  range?: { min: any; max: any }; // Range for between
  caseSensitive?: boolean;        // For string operations
}

/**
 * Filter group with logical operator
 */
export interface FilterGroup {
  operator: LogicalOperator;
  predicates: (FilterPredicate | FilterGroup)[];
}

/**
 * Root filter configuration
 */
export interface FilterConfig {
  operator?: LogicalOperator; // Default: AND
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
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Filter metrics for performance monitoring
 */
export interface FilterMetrics {
  id: string;
  tenantId: string;
  dashboardId?: string;
  predicateHash: string;
  durationMs: number;
  cacheHit: boolean;
  rowCount?: number;
  errorMessage?: string;
  createdAt: Date;
}

/**
 * Cross-filter event
 */
export interface CrossFilterEvent {
  sourceChartId: string;
  field: string;
  values: any[];
  operator: FilterOperator;
  timestamp: number;
}

