import { Request, Response, NextFunction } from 'express';
import { createRequestLogger } from '../logger/logger.js';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const startTime = Date.now();
  const requestId =
    (req.headers['x-request-id'] as string) || generateRequestId();

  // Attach request ID to request object
  req.headers['x-request-id'] = requestId;

  // Create logger with request context
  const logger = createRequestLogger(req);

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any): Response {
    const duration = Date.now() - startTime;

    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });

    return originalSend.call(this, data);
  };

  // Add request ID to response headers
  res.setHeader('X-Request-ID', requestId);

  next();
};

const generateRequestId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

