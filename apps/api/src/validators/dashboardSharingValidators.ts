import Joi from 'joi';

export const shareDashboardSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  permission: Joi.string().valid('view', 'edit').required(),
  createdBy: Joi.string().uuid().optional(),
}).unknown(false);

export const createPublicLinkSchema = Joi.object({
  expiresAt: Joi.date().iso().optional(),
  createdBy: Joi.string().uuid().optional(),
}).unknown(false);

