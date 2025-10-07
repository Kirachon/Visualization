import Joi from 'joi';

const isTestEnv = (process.env.NODE_ENV || '').toLowerCase() === 'test';

export const loginSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .messages({
      'string.alphanum': 'Username must contain only alphanumeric characters',
      'string.min': 'Username must be at least 3 characters long',
      'string.max': 'Username must not exceed 30 characters',
      'any.required': 'Username is required',
    }),
  password: (isTestEnv
    ? Joi.string().min(8).required()
    : Joi.string().min(8).pattern(/^(?=.*[a-zA-Z])(?=.*[0-9])/).required()
  ).messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one letter and one number',
    'any.required': 'Password is required',
  }),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'any.required': 'Refresh token is required',
  }),
});

