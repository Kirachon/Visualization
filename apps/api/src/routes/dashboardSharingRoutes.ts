import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { shareDashboardSchema, createPublicLinkSchema } from '../validators/dashboardSharingValidators.js';
import {
  shareDashboard,
  listDashboardShares,
  revokeShare,
  createPublicLink,
  listPublicLinks,
  getPublicDashboard,
  revokePublicLink,
} from '../controllers/dashboardSharingController.js';

const router = Router();

// Dashboard sharing routes
router.post('/dashboards/:id/share', validate(shareDashboardSchema), shareDashboard);
router.get('/dashboards/:id/shares', listDashboardShares);
router.delete('/dashboards/:id/share/:userId', revokeShare);

// Public link routes
router.post('/dashboards/:id/public-link', validate(createPublicLinkSchema), createPublicLink);
router.get('/dashboards/:id/public-links', listPublicLinks);
router.delete('/dashboards/:id/public-links/:linkId', revokePublicLink);

// Public access route (no auth required)
router.get('/public/dashboards/:token', getPublicDashboard);

export default router;

