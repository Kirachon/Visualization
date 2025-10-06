import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.js';
import { securityController } from '../controllers/securityController.js';

const router = Router();

router.post('/retention/policies', authenticate, requireRole(['Admin','SuperAdmin']), securityController.createRetentionPolicy.bind(securityController));
router.get('/retention/policies', authenticate, securityController.listRetentionPolicies.bind(securityController));
router.post('/gdpr/requests', authenticate, securityController.createGdprRequest.bind(securityController));
router.get('/gdpr/requests', authenticate, securityController.listGdprRequests.bind(securityController));
router.post('/gdpr/requests/:id/execute', authenticate, requireRole(['Admin','SuperAdmin']), securityController.executeGdprRequest.bind(securityController));
router.get('/security/vulns', authenticate, securityController.listVulnFindings.bind(securityController));
router.get('/security/ids-events', authenticate, securityController.listIdsEvents.bind(securityController));
router.get('/audit/verify', authenticate, securityController.verifyAuditChain.bind(securityController));
router.get('/audit/report', authenticate, securityController.exportAuditReport.bind(securityController));


export default router;

