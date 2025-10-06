import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { maskingController } from '../controllers/maskingController.js';

const router = Router();

router.post('/masking/dry-run', authenticate, maskingController.dryRun.bind(maskingController));

export default router;

