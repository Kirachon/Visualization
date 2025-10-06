import Joi from 'joi';

const componentSchema = Joi.object({
  id: Joi.string().required(),
  type: Joi.string().valid('bar', 'line', 'pie', 'table').required(),
  x: Joi.number().integer().min(0).required(),
  y: Joi.number().integer().min(0).required(),
  w: Joi.number().integer().min(1).required(),
  h: Joi.number().integer().min(1).required(),
  dataBinding: Joi.object({
    dataSourceId: Joi.string().uuid().required(),
    query: Joi.string().required(),
    fieldMapping: Joi.object().pattern(Joi.string(), Joi.string()).required(),
  }).optional(),
  config: Joi.object().optional(),
});

const layoutSchema = Joi.object({
  cols: Joi.number().integer().min(1).max(24).required(),
  rowHeight: Joi.number().integer().min(10).required(),
});

export const createDashboardSchema = Joi.object({
  name: Joi.string().max(255).required(),
  description: Joi.string().max(1000).optional(),
  layout: layoutSchema.optional(),
  components: Joi.array().items(componentSchema).optional(),
  tenantId: Joi.string().uuid().optional(),
  ownerId: Joi.string().uuid().optional(),
}).unknown(false);

export const updateDashboardSchema = Joi.object({
  name: Joi.string().max(255).optional(),
  description: Joi.string().max(1000).optional(),
  layout: layoutSchema.optional(),
  components: Joi.array().items(componentSchema).optional(),
  isPublic: Joi.boolean().optional(),
  tenantId: Joi.string().uuid().optional(),
}).unknown(false);

