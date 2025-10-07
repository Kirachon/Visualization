/**
 * Filter Evaluation Service Tests
 * Story 2.3: Advanced Filtering & Cross-Filtering
 */

import { FilterEvaluationService } from '../filterEvaluationService';
import { FilterOperator, LogicalOperator, FilterConfig } from '../../types/filter';

describe('FilterEvaluationService', () => {
  let service: FilterEvaluationService;

  beforeEach(() => {
    service = new FilterEvaluationService();
  });

  describe('Predicate Validation', () => {
    it('should validate field names', () => {
      const filter: FilterConfig = {
        predicates: [
          {
            field: 'valid_field',
            operator: FilterOperator.EQ,
            value: 'test',
          },
        ],
      };

      expect(() => service['validateFilter'](filter)).not.toThrow();
    });

    it('should reject invalid field names with SQL injection attempts', () => {
      const filter: FilterConfig = {
        predicates: [
          {
            field: 'field; DROP TABLE users;',
            operator: FilterOperator.EQ,
            value: 'test',
          },
        ],
      };

      expect(() => service['validateFilter'](filter)).toThrow('Invalid field name');
    });

    it('should validate IN operator requires values array', () => {
      const filter: FilterConfig = {
        predicates: [
          {
            field: 'status',
            operator: FilterOperator.IN,
            value: 'active', // Wrong: should be values array
          },
        ],
      };

      expect(() => service['validateFilter'](filter)).toThrow('requires non-empty values array');
    });

    it('should validate BETWEEN operator requires range', () => {
      const filter: FilterConfig = {
        predicates: [
          {
            field: 'age',
            operator: FilterOperator.BETWEEN,
            value: 25, // Wrong: should be range object
          },
        ],
      };

      expect(() => service['validateFilter'](filter)).toThrow('requires range with min and max');
    });

    it('should validate REGEX operator pattern', () => {
      const filter: FilterConfig = {
        predicates: [
          {
            field: 'email',
            operator: FilterOperator.REGEX,
            value: '[invalid(regex',
          },
        ],
      };

      expect(() => service['validateFilter'](filter)).toThrow('Invalid regex pattern');
    });

    it('should enforce maximum predicate depth', () => {
      // Create deeply nested filter groups
      let deepFilter: any = {
        operator: LogicalOperator.AND,
        predicates: [
          {
            field: 'field1',
            operator: FilterOperator.EQ,
            value: 'value1',
          },
        ],
      };

      // Nest 10 levels deep (exceeds MAX_PREDICATE_DEPTH of 5)
      for (let i = 0; i < 10; i++) {
        deepFilter = {
          operator: LogicalOperator.AND,
          predicates: [deepFilter],
        };
      }

      expect(() => service['validateFilter'](deepFilter)).toThrow('Filter depth exceeds maximum');
    });
  });

  describe('SQL Generation', () => {
    it('should generate SQL for EQ operator', () => {
      const filter: FilterConfig = {
        predicates: [
          {
            field: 'name',
            operator: FilterOperator.EQ,
            value: 'John',
          },
        ],
      };

      const { sql, params } = service['buildWhereClause'](filter);
      expect(sql).toBe('name = $1');
      expect(params).toEqual(['John']);
    });

    it('should generate SQL for BETWEEN operator', () => {
      const filter: FilterConfig = {
        predicates: [
          {
            field: 'age',
            operator: FilterOperator.BETWEEN,
            range: { min: 18, max: 65 },
          },
        ],
      };

      const { sql, params } = service['buildWhereClause'](filter);
      expect(sql).toBe('age BETWEEN $1 AND $2');
      expect(params).toEqual([18, 65]);
    });

    it('should generate SQL for IN operator', () => {
      const filter: FilterConfig = {
        predicates: [
          {
            field: 'status',
            operator: FilterOperator.IN,
            values: ['active', 'pending', 'completed'],
          },
        ],
      };

      const { sql, params } = service['buildWhereClause'](filter);
      expect(sql).toBe('status IN ($1, $2, $3)');
      expect(params).toEqual(['active', 'pending', 'completed']);
    });

    it('should generate SQL for CONTAINS operator (case-insensitive)', () => {
      const filter: FilterConfig = {
        predicates: [
          {
            field: 'description',
            operator: FilterOperator.CONTAINS,
            value: 'test',
            caseSensitive: false,
          },
        ],
      };

      const { sql, params } = service['buildWhereClause'](filter);
      expect(sql).toBe('LOWER(description) LIKE LOWER($1)');
      expect(params).toEqual(['%test%']);
    });

    it('should generate SQL for CONTAINS operator (case-sensitive)', () => {
      const filter: FilterConfig = {
        predicates: [
          {
            field: 'description',
            operator: FilterOperator.CONTAINS,
            value: 'Test',
            caseSensitive: true,
          },
        ],
      };

      const { sql, params } = service['buildWhereClause'](filter);
      expect(sql).toBe('description LIKE $1');
      expect(params).toEqual(['%Test%']);
    });

    it('should generate SQL for IS_NULL operator', () => {
      const filter: FilterConfig = {
        predicates: [
          {
            field: 'deleted_at',
            operator: FilterOperator.IS_NULL,
          },
        ],
      };

      const { sql, params } = service['buildWhereClause'](filter);
      expect(sql).toBe('deleted_at IS NULL');
      expect(params).toEqual([]);
    });

    it('should generate SQL for AND logic with multiple predicates', () => {
      const filter: FilterConfig = {
        operator: LogicalOperator.AND,
        predicates: [
          {
            field: 'age',
            operator: FilterOperator.GT,
            value: 18,
          },
          {
            field: 'status',
            operator: FilterOperator.EQ,
            value: 'active',
          },
        ],
      };

      const { sql, params } = service['buildWhereClause'](filter);
      expect(sql).toBe('(age > $1 AND status = $2)');
      expect(params).toEqual([18, 'active']);
    });

    it('should generate SQL for OR logic with multiple predicates', () => {
      const filter: FilterConfig = {
        operator: LogicalOperator.OR,
        predicates: [
          {
            field: 'role',
            operator: FilterOperator.EQ,
            value: 'admin',
          },
          {
            field: 'role',
            operator: FilterOperator.EQ,
            value: 'moderator',
          },
        ],
      };

      const { sql, params } = service['buildWhereClause'](filter);
      expect(sql).toBe('(role = $1 OR role = $2)');
      expect(params).toEqual(['admin', 'moderator']);
    });

    it('should generate SQL for nested filter groups', () => {
      const filter: FilterConfig = {
        operator: LogicalOperator.AND,
        predicates: [
          {
            field: 'age',
            operator: FilterOperator.GT,
            value: 18,
          },
          {
            operator: LogicalOperator.OR,
            predicates: [
              {
                field: 'country',
                operator: FilterOperator.EQ,
                value: 'US',
              },
              {
                field: 'country',
                operator: FilterOperator.EQ,
                value: 'CA',
              },
            ],
          },
        ],
      };

      const { sql, params } = service['buildWhereClause'](filter);
      expect(sql).toContain('age > $1');
      expect(sql).toContain('country = $2');
      expect(sql).toContain('country = $3');
      expect(sql).toContain('AND');
      expect(sql).toContain('OR');
      expect(params).toEqual([18, 'US', 'CA']);
    });
  });

  describe('Caching', () => {
    it('should generate consistent hash for same predicate', () => {
      const filter: FilterConfig = {
        predicates: [
          {
            field: 'name',
            operator: FilterOperator.EQ,
            value: 'John',
          },
        ],
      };

      const hash1 = service['hashPredicate'](filter);
      const hash2 = service['hashPredicate'](filter);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different predicates', () => {
      const filter1: FilterConfig = {
        predicates: [
          {
            field: 'name',
            operator: FilterOperator.EQ,
            value: 'John',
          },
        ],
      };

      const filter2: FilterConfig = {
        predicates: [
          {
            field: 'name',
            operator: FilterOperator.EQ,
            value: 'Jane',
          },
        ],
      };

      const hash1 = service['hashPredicate'](filter1);
      const hash2 = service['hashPredicate'](filter2);

      expect(hash1).not.toBe(hash2);
    });
  });
});

