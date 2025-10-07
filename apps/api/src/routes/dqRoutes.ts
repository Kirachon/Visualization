import { Router } from 'express';
import { dqController } from '../controllers/dqController.js';

const router = Router();

router.get('/dq/rules', dqController.listRules.bind(dqController));
router.post('/dq/rules', dqController.createRule.bind(dqController));
router.get('/dq/rules/:id', dqController.getRule.bind(dqController));
router.put('/dq/rules/:id', dqController.updateRule.bind(dqController));
router.delete('/dq/rules/:id', dqController.deleteRule.bind(dqController));
router.get('/dq/results', dqController.listResults.bind(dqController));
router.get('/dq/profiles', dqController.listProfiles.bind(dqController));
router.get('/dq/scores', dqController.listScores.bind(dqController));

export default router;

