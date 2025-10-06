import Joi from 'joi';

export const createUserSchema = Joi.object({
  username: Joi.string().min(3).max(255).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().max(100).required(),
  lastName: Joi.string().max(100).required(),
  roleId: Joi.string().uuid().required(),
  tenantId: Joi.string().uuid().optional(),
}).unknown(false);

export const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  firstName: Joi.string().max(100).optional(),
  lastName: Joi.string().max(100).optional(),
  roleId: Joi.string().uuid().optional(),
  isActive: Joi.boolean().optional(),
  profilePicture: Joi.string().uri().optional(),
  phoneNumber: Joi.string().max(20).optional(),
  timezone: Joi.string().max(50).optional(),
  language: Joi.string().max(10).optional(),
  tenantId: Joi.string().uuid().optional(),
}).unknown(false);

export const passwordResetInitiateSchema = Joi.object({
  email: Joi.string().email().required(),
}).unknown(false);

export const passwordResetCompleteSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
}).unknown(false);

