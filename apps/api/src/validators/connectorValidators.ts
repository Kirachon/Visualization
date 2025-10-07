/**
 * Connector Validators
 * 
 * Validation schemas for connector API endpoints using Joi.
 */

import Joi from 'joi';

/**
 * Schema for testing database connection
 */
export const testConnectionSchema = Joi.object({
  type: Joi.string()
    .valid('postgresql', 'mysql')
    .required()
    .messages({
      'any.required': 'Connector type is required',
      'any.only': 'Connector type must be either postgresql or mysql',
    }),
  config: Joi.object({
    host: Joi.string().required().messages({
      'any.required': 'Host is required',
    }),
    port: Joi.number().integer().min(1).max(65535).required().messages({
      'any.required': 'Port is required',
      'number.min': 'Port must be between 1 and 65535',
      'number.max': 'Port must be between 1 and 65535',
    }),
    database: Joi.string().required().messages({
      'any.required': 'Database name is required',
    }),
    username: Joi.string().required().messages({
      'any.required': 'Username is required',
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required',
    }),
    ssl: Joi.boolean().optional(),
  }).required(),
});

/**
 * Schema for introspecting database schema
 */
export const introspectSchemaSchema = Joi.object({
  type: Joi.string()
    .valid('postgresql', 'mysql')
    .required()
    .messages({
      'any.required': 'Connector type is required',
      'any.only': 'Connector type must be either postgresql or mysql',
    }),
  config: Joi.object({
    host: Joi.string().required(),
    port: Joi.number().integer().min(1).max(65535).required(),
    database: Joi.string().required(),
    username: Joi.string().required(),
    password: Joi.string().required(),
    ssl: Joi.boolean().optional(),
  }).required(),
});

/**
 * Schema for starting file import
 */
export const startImportSchema = Joi.object({
  dataSourceId: Joi.string().uuid().required().messages({
    'any.required': 'Data source ID is required',
    'string.guid': 'Data source ID must be a valid UUID',
  }),
  fileName: Joi.string().required().messages({
    'any.required': 'File name is required',
  }),
  fileType: Joi.string()
    .valid('csv', 'json')
    .required()
    .messages({
      'any.required': 'File type is required',
      'any.only': 'File type must be either csv or json',
    }),
  tableName: Joi.string().required().messages({
    'any.required': 'Table name is required',
  }),
  options: Joi.object({
    batchSize: Joi.number().integer().min(1).max(10000).optional().default(1000),
    mode: Joi.string().valid('insert', 'upsert', 'replace').optional().default('insert'),
    delimiter: Joi.string().length(1).optional().default(','),
    hasHeader: Joi.boolean().optional().default(true),
    columnMapping: Joi.object().pattern(Joi.string(), Joi.string()).optional(),
  }).optional(),
});

