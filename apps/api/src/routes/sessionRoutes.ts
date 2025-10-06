import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { sessionService } from '../services/sessionService.js';

const router = Router();

router.get('/auth/sessions', authenticate, async (req, res, next) => {
  try {
    const sessions = await sessionService.listUserSessions(req.user!.userId);
    res.json(sessions);
  } catch (err) { next(err); }
});

router.delete('/auth/sessions/:token', authenticate, async (req, res, next) => {
  try {
    const ok = await sessionService.revoke(req.params.token);
    if (!ok) { res.status(404).json({ error: 'Session not found' }); return; }
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;

