import { Router } from 'express';
import { getSlowQueries, getCacheStats } from '../controllers/perfController.js';

const router = Router();

router.get('/perf/queries/slow', getSlowQueries);
router.get('/perf/cache/stats', getCacheStats);

export default router;

