import { Request, Response, NextFunction } from 'express';
import { mfaService } from '../services/mfaService.js';

export class MfaController {
  async setup(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
      const email = (req as any).user?.username || 'user';
      const { secretB32, otpauth } = mfaService.generateSecret(email);
      // Do NOT persist secret yet. Client must verify first.
      res.status(200).json({ secret: secretB32, otpauth });
    } catch (err) { next(err); }
  }

  async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
      const { secret, code } = req.body || {};
      if (!secret || !code) { res.status(400).json({ error: 'secret and code required' }); return; }
      const ok = await mfaService.verifyAndEnable(req.user.userId, secret, code);
      if (!ok) { res.status(400).json({ error: 'Invalid code' }); return; }
      res.status(200).json({ message: 'MFA enabled' });
    } catch (err) { next(err); }
  }
}

export const mfaController = new MfaController();

