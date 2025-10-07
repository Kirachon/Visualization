import { Router } from 'express';
import { scheduleController } from '../controllers/scheduleController.js';

const router = Router();

router.get('/schedules', scheduleController.list.bind(scheduleController));
router.post('/schedules', scheduleController.create.bind(scheduleController));
router.get('/schedules/:id', scheduleController.get.bind(scheduleController));
router.put('/schedules/:id', scheduleController.update.bind(scheduleController));
router.delete('/schedules/:id', scheduleController.delete.bind(scheduleController));
router.post('/schedules/:id/pause', scheduleController.pause.bind(scheduleController));
router.post('/schedules/:id/resume', scheduleController.resume.bind(scheduleController));
router.post('/schedules/:id/run-now', scheduleController.runNow.bind(scheduleController));

export default router;

