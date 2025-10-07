import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService.js';
import { ValidationError } from '../middleware/errorHandler.js';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { username, password } = req.body;
      // Input validation is now handled by validation middleware

      // Authenticate user
      const result = await authService.authenticate({ username, password });

      // Set httpOnly cookie for token
      res.cookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000, // 1 hour
      });

      // Set httpOnly cookie for refresh token
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 604800000, // 7 days
      });

      const userResponse = {
        ...result.user,
        role: { id: (result.user as any).roleId, name: (result.user as any).roleName },
      };
      res.status(200).json({
        user: userResponse,
        token: result.token,
        refreshToken: result.refreshToken,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Clear cookies
      res.clearCookie('token');
      res.clearCookie('refreshToken');

      res.status(200).json({
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      // Get refresh token from httpOnly cookie or request body (for tests)
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        throw new ValidationError('Refresh token is required');
      }

      const newToken = await authService.refreshAccessToken(refreshToken);

      // Set new token in cookie
      res.cookie('token', newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000, // 1 hour
      });

      res.status(200).json({
        token: newToken,
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const userResponse = req.user ? {
        ...req.user,
        role: { id: req.user.roleId, name: req.user.roleName },
      } : undefined;
      res.status(200).json({
        user: userResponse,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();

