import { Router } from 'express';
import { optimizerController } from '../controllers/optimizerController.js';

const router = Router();

router.post('/optimize/analyze', optimizerController.analyze.bind(optimizerController));

export default router;

