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

      // Optional session rotation after step-up when cookie sessions are enabled.
      if ((process.env.SESSIONS_COOKIE_MODE || 'false').toLowerCase() === 'true') {
        const old = req.cookies?.sid;
        if (old) { try { const { sessionService } = await import('../services/sessionService.js'); await sessionService.revoke(old); } catch {}
        }
        const newToken = require('crypto').randomBytes(32).toString('hex');
        const { sessionService } = await import('../services/sessionService.js');
        const ua = req.get('user-agent') || undefined;
        const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || undefined;
        const expires = new Date(Date.now() + 24*3600_000);
        await sessionService.create({ userId: req.user.userId, token: newToken, expiresAt: expires, userAgent: ua, ipAddress: ip });
        res.cookie('sid', newToken, { httpOnly: true, secure: true, sameSite: 'strict', expires });
      }

      res.status(200).json({ message: 'MFA enabled' });
    } catch (err) { next(err); }
  }

  async generateRecovery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
      const codes = await mfaService.generateRecoveryCodes(req.user.userId, 10);
      res.json({ codes });
    } catch (err) { next(err); }
  }

  async verifyRecovery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) { res.status(401).json({ error: 'Unauthorized' }); return; }
      const { code } = req.body || {};
      if (!code) { res.status(400).json({ error: 'code required' }); return; }
      const ok = await mfaService.verifyRecoveryCode(req.user.userId, code);
      if (!ok) { res.status(400).json({ error: 'Invalid code' }); return; }
      res.json({ success: true });
    } catch (err) { next(err); }
  }
}

export const mfaController = new MfaController();

