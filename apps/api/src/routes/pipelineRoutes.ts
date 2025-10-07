import { Router } from 'express';
import { pipelineController } from '../controllers/pipelineController.js';

const router = Router();

router.post('/pipelines/validate', pipelineController.validate.bind(pipelineController));
router.post('/pipelines/plan', pipelineController.plan.bind(pipelineController));
router.get('/pipelines/transforms', pipelineController.listTransforms.bind(pipelineController));

export default router;

