import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { rbacController } from '../controllers/rbacController.js';
import { rbacEscalationController } from '../controllers/rbacEscalationController.js';

const router = Router();

// Roles
router.get('/rbac/roles', authenticate, requireRole(['Admin','SuperAdmin']), rbacController.listRoles.bind(rbacController));
router.post('/rbac/roles', authenticate, requireRole(['Admin','SuperAdmin']), rbacController.createRole.bind(rbacController));
router.get('/rbac/roles/:id/permissions', authenticate, requireRole(['Admin','SuperAdmin']), rbacController.getRolePermissions.bind(rbacController));

// Assignments
router.post('/rbac/assign', authenticate, requireRole(['Admin','SuperAdmin']), rbacController.assignRole.bind(rbacController));
router.delete('/rbac/assign', authenticate, requireRole(['Admin','SuperAdmin']), rbacController.revokeRole.bind(rbacController));

// Access Escalations
router.post('/rbac/escalations', authenticate, rbacEscalationController.create.bind(rbacEscalationController));
router.get('/rbac/escalations', authenticate, requireRole(['Admin','SuperAdmin']), rbacEscalationController.list.bind(rbacEscalationController));
router.post('/rbac/escalations/:id/approve', authenticate, requireRole(['Admin','SuperAdmin']), rbacEscalationController.approve.bind(rbacEscalationController));

export default router;

