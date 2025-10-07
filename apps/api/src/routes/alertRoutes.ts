import { Router } from 'express';
import { alertController } from '../controllers/alertController.js';

const router = Router();

router.get('/alerts', alertController.list.bind(alertController));
router.post('/alerts', alertController.create.bind(alertController));
router.get('/alerts/:id', alertController.get.bind(alertController));
router.put('/alerts/:id', alertController.update.bind(alertController));
router.delete('/alerts/:id', alertController.delete.bind(alertController));
router.post('/alerts/:id/test', alertController.test.bind(alertController));
router.get('/alerts/:id/history', alertController.history.bind(alertController));

export default router;

