import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import {
  AuthenticationError,
  AuthorizationError,
} from './errorHandler.js';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        username: string;
        tenantId: string;
        roleId: string;
        roleName: string;
        department?: string | null;
        region?: string | null;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const decoded = authService.verifyToken(token);

    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      username: decoded.username,
      tenantId: decoded.tenantId,
      roleId: decoded.roleId,
      roleName: decoded.roleName,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (resource: string, action: string) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }

      const hasPermission = await authService.authorize(
        req.user.userId,
        resource,
        action,
        req.user.tenantId
      );

      if (!hasPermission) {
        throw new AuthorizationError(
          `Insufficient permissions for ${resource}:${action}`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AuthenticationError('User not authenticated');
      }

      if (!allowedRoles.includes(req.user.roleName)) {
        throw new AuthorizationError(
          `Role ${req.user.roleName} is not authorized`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

