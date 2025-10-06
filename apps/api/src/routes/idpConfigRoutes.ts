import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { idpConfigController } from '../controllers/idpConfigController.js';

const router = Router();

// Protect with auth; optionally restrict to admin roles
router.get('/idp-configs', authenticate, idpConfigController.list.bind(idpConfigController));
router.post('/idp-configs', authenticate, requireRole(['Admin','SuperAdmin']), idpConfigController.create.bind(idpConfigController));
router.put('/idp-configs/:id', authenticate, requireRole(['Admin','SuperAdmin']), idpConfigController.update.bind(idpConfigController));
router.delete('/idp-configs/:id', authenticate, requireRole(['Admin','SuperAdmin']), idpConfigController.remove.bind(idpConfigController));

export default router;

