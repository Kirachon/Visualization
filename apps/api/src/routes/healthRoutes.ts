import { Router } from 'express';
import { healthController } from '../controllers/healthController.js';

const router = Router();

router.get('/health', healthController.check.bind(healthController));
router.get('/liveness', healthController.liveness.bind(healthController));
router.get('/readiness', healthController.readiness.bind(healthController));

export default router;

