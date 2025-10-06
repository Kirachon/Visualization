import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { activityController } from '../controllers/activityController.js';

const router = Router();

router.get('/activities', authenticate, activityController.list.bind(activityController));

export default router;

