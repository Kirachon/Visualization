import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
import { ValidationError } from './errorHandler.js';

export const validate = (schema: Schema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      next(new ValidationError(errorMessage));
      return;
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
};

