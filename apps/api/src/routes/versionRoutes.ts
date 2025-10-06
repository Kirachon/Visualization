import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { versionController } from '../controllers/versionController.js';

const router = Router();

router.post('/dashboards/:dashboardId/versions', authenticate, versionController.create.bind(versionController));
router.get('/dashboards/:dashboardId/versions', authenticate, versionController.list.bind(versionController));
router.get('/versions/:id', authenticate, versionController.get.bind(versionController));

export default router;

