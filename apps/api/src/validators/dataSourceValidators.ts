import Joi from 'joi';

export const createDataSourceSchema = Joi.object({
  name: Joi.string().max(255).required(),
  type: Joi.string().valid('postgresql').required(),
  connectionConfig: Joi.object({
    host: Joi.string().hostname().required(),
    port: Joi.number().integer().min(1).max(65535).required(),
    database: Joi.string().required(),
    username: Joi.string().required(),
    password: Joi.string().min(1).required(),
    ssl: Joi.boolean().default(false),
  }).required(),
  tenantId: Joi.string().uuid().optional(),
  ownerId: Joi.string().uuid().optional(),
}).unknown(false);

export const updateDataSourceSchema = Joi.object({
  name: Joi.string().max(255).optional(),
  connectionConfig: Joi.object({
    host: Joi.string().hostname().optional(),
    port: Joi.number().integer().min(1).max(65535).optional(),
    database: Joi.string().optional(),
    username: Joi.string().optional(),
    password: Joi.string().optional(),
    ssl: Joi.boolean().optional(),
  }).optional(),
  status: Joi.string().valid('active', 'inactive', 'error').optional(),
  tenantId: Joi.string().uuid().optional(),
}).unknown(false);

export const testConnectionSchema = Joi.object({
  connectionConfig: Joi.object({
    host: Joi.string().required(),
    port: Joi.number().integer().required(),
    database: Joi.string().required(),
    username: Joi.string().required(),
    password: Joi.alternatives(
      Joi.string(),
      Joi.object({ iv: Joi.string(), authTag: Joi.string(), ct: Joi.string() })
    ).required(),
    ssl: Joi.boolean().optional(),
  }).required(),
}).unknown(false);

