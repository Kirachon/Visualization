/**
 * Filter Validators
 * Story 2.3: Advanced Filtering & Cross-Filtering
 */

import Joi from 'joi';
import { FilterOperator, LogicalOperator } from '../types/filter.js';

/**
 * Filter predicate schema
 */
const filterPredicateSchema = Joi.object({
  field: Joi.string().required().pattern(/^[a-zA-Z0-9_.]+$/),
  operator: Joi.string().valid(...Object.values(FilterOperator)).required(),
  value: Joi.any(),
  values: Joi.array().items(Joi.any()),
  range: Joi.object({
    min: Joi.any().required(),
    max: Joi.any().required(),
  }),
  caseSensitive: Joi.boolean(),
});

/**
 * Filter group schema (recursive)
 */
const filterGroupSchema: any = Joi.object({
  operator: Joi.string().valid(...Object.values(LogicalOperator)).required(),
  predicates: Joi.array().items(
    Joi.alternatives().try(
      filterPredicateSchema,
      Joi.link('#filterGroup')
    )
  ).required().min(1),
}).id('filterGroup');

/**
 * Filter config schema
 */
const filterConfigSchema = Joi.object({
  operator: Joi.string().valid(...Object.values(LogicalOperator)),
  predicates: Joi.array().items(
    Joi.alternatives().try(
      filterPredicateSchema,
      filterGroupSchema
    )
  ).required().min(1),
});

/**
 * Evaluate filter request schema
 */
export const evaluateFilterSchema = Joi.object({
  dashboardId: Joi.string().uuid(),
  dataSourceId: Joi.string().uuid(),
  tableName: Joi.string(),
  filter: filterConfigSchema.required(),
  options: Joi.object({
    limit: Joi.number().integer().min(1).max(10000),
    offset: Joi.number().integer().min(0),
    useCache: Joi.boolean(),
  }),
});

/**
 * Create filter set request schema
 */
export const createFilterSetSchema = Joi.object({
  dashboardId: Joi.string().uuid(),
  name: Joi.string().required().min(1).max(255),
  description: Joi.string().max(1000),
  predicates: filterConfigSchema.required(),
  isGlobal: Joi.boolean(),
});

/**
 * Update filter set request schema
 */
export const updateFilterSetSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  description: Joi.string().max(1000).allow(null),
  predicates: filterConfigSchema,
  isGlobal: Joi.boolean(),
}).min(1);

/**
 * List filter sets query schema
 */
export const listFilterSetsSchema = Joi.object({
  dashboardId: Joi.string().uuid(),
  isGlobal: Joi.boolean(),
  limit: Joi.number().integer().min(1).max(100),
  offset: Joi.number().integer().min(0),
});

