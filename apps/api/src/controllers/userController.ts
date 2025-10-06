import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService.js';

export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId || req.body.tenantId;
    const { tenantId: _, ...input } = req.body;
    const user = await userService.create({ ...input, tenantId });
    // Don't return password hash
    const { passwordHash, passwordResetToken, ...safeUser } = user as any;
    res.status(201).json(safeUser);
  } catch (err) {
    next(err);
  }
};

export const listUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string);
    const includeDeleted = req.query.includeDeleted === 'true';
    const users = await userService.list(tenantId, includeDeleted);
    // Don't return password hashes
    const safeUsers = users.map(({ passwordHash, passwordResetToken, ...u }: any) => u);
    res.json(safeUsers);
  } catch (err) {
    next(err);
  }
};

export const getUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string);
    const user = await userService.getById(req.params.id, tenantId);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    const { passwordHash, passwordResetToken, ...safeUser } = user as any;
    res.json(safeUser);
    return;
  } catch (err) {
    next(err);
  }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId || req.body.tenantId;
    const { tenantId: _, ...input } = req.body;
    const user = await userService.update(req.params.id, tenantId, input);
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    const { passwordHash, passwordResetToken, ...safeUser } = user as any;
    res.json(safeUser);
    return;
  } catch (err) {
    next(err);
  }
};

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string);
    const ok = await userService.remove(req.params.id, tenantId);
    if (!ok) { res.status(404).json({ error: 'User not found' }); return; }
    res.status(204).send();
    return;
  } catch (err) {
    next(err);
  }
};

export const initiatePasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;
    const result = await userService.initiatePasswordReset(email);
    
    // Always return success to prevent email enumeration
    res.json({ 
      message: 'If the email exists, a password reset link has been sent.',
      // In production, don't return token - send via email
      ...(process.env.NODE_ENV === 'test' && result ? { token: result.token } : {})
    });
  } catch (err) {
    next(err);
  }
};

export const completePasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    const ok = await userService.resetPassword(token, newPassword);
    if (!ok) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
};

