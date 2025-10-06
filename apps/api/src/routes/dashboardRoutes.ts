import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { createDashboardSchema, updateDashboardSchema } from '../validators/dashboardValidators.js';
import {
  createDashboard,
  listDashboards,
  getDashboard,
  updateDashboard,
  deleteDashboard,
} from '../controllers/dashboardController.js';

const router = Router();

router.post('/dashboards', validate(createDashboardSchema), createDashboard);
router.get('/dashboards', listDashboards);
router.get('/dashboards/:id', getDashboard);
router.put('/dashboards/:id', validate(updateDashboardSchema), updateDashboard);
router.delete('/dashboards/:id', deleteDashboard);

export default router;

