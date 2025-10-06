import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { validate } from '../validate.js';
import { ValidationError } from '../errorHandler.js';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    mockResponse = {};
    mockNext = jest.fn();
  });

  it('should pass validation with valid data', () => {
    const schema = Joi.object({
      username: Joi.string().required(),
      password: Joi.string().required(),
    });

    mockRequest.body = {
      username: 'testuser',
      password: 'password123',
    };

    const middleware = validate(schema);
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect(mockRequest.body).toEqual({
      username: 'testuser',
      password: 'password123',
    });
  });

  it('should fail validation with invalid data', () => {
    const schema = Joi.object({
      username: Joi.string().required(),
      password: Joi.string().required(),
    });

    mockRequest.body = {
      username: 'testuser',
      // password missing
    };

    const middleware = validate(schema);
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    const error = (mockNext as jest.Mock).mock.calls[0][0];
    expect(error.message).toContain('password');
  });

  it('should strip unknown fields', () => {
    const schema = Joi.object({
      username: Joi.string().required(),
      password: Joi.string().required(),
    });

    mockRequest.body = {
      username: 'testuser',
      password: 'password123',
      extraField: 'should be removed',
    };

    const middleware = validate(schema);
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith();
    expect(mockRequest.body).toEqual({
      username: 'testuser',
      password: 'password123',
    });
    expect(mockRequest.body).not.toHaveProperty('extraField');
  });

  it('should combine multiple validation errors', () => {
    const schema = Joi.object({
      username: Joi.string().min(3).required(),
      password: Joi.string().min(8).required(),
    });

    mockRequest.body = {
      username: 'ab', // too short
      password: 'pass', // too short
    };

    const middleware = validate(schema);
    middleware(mockRequest as Request, mockResponse as Response, mockNext);

    expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    const error = (mockNext as jest.Mock).mock.calls[0][0];
    expect(error.message).toContain('username');
    expect(error.message).toContain('password');
  });
});

