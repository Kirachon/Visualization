import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { mfaController } from '../controllers/mfaController.js';

const router = Router();

// Feature-flag gate at controller/service level
router.post('/mfa/setup', authenticate, mfaController.setup.bind(mfaController));
router.post('/mfa/verify', authenticate, mfaController.verify.bind(mfaController));

export default router;

