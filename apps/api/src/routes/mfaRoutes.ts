import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { mfaController } from '../controllers/mfaController.js';

const router = Router();

// Feature-flag gate at controller/service level
router.post('/mfa/setup', authenticate, mfaController.setup.bind(mfaController));
router.post('/mfa/verify', authenticate, mfaController.verify.bind(mfaController));
router.post('/mfa/recovery-codes', authenticate, mfaController.generateRecovery.bind(mfaController));
router.post('/mfa/recovery-verify', authenticate, mfaController.verifyRecovery.bind(mfaController));

export default router;

