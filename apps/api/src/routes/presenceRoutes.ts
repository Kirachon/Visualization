import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { presenceController } from '../controllers/presenceController.js';

const router = Router();

router.get('/presence/:dashboardId', authenticate, presenceController.listActive.bind(presenceController));

export default router;

