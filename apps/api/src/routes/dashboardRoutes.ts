import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';
import { requireShareLevel } from '../middleware/sharing.js';
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
router.get('/dashboards/:id', authenticate, requireShareLevel('view'), getDashboard);
router.put('/dashboards/:id', authenticate, requireShareLevel('edit'), validate(updateDashboardSchema), updateDashboard);
router.delete('/dashboards/:id', authenticate, requireShareLevel('admin'), deleteDashboard);

export default router;

