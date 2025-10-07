import Joi from 'joi';

export const executeQuerySchema = Joi.object({
  // Either provide connectionConfig explicitly, or omit it to use data-source by :id
  connectionConfig: Joi.object({
    host: Joi.string().required(),
    port: Joi.number().required(),
    database: Joi.string().required(),
    username: Joi.string().required(),
    password: Joi.alternatives(Joi.string(), Joi.object({ iv: Joi.string(), authTag: Joi.string(), ct: Joi.string() })).required(),
    ssl: Joi.boolean().optional(),
  }).optional(),
  sql: Joi.string().max(10000).required(),
  params: Joi.array().items(Joi.any()).optional(),
  limit: Joi.number().integer().min(1).max(1000).optional(),
  offset: Joi.number().integer().min(0).optional(),
  timeoutMs: Joi.number().integer().min(1000).max(120000).optional(),
  useOlap: Joi.boolean().optional(),
});

