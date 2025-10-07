import { Router } from 'express';
import { getSlowQueries, getCacheStats, getEngineSplit } from '../controllers/perfController.js';

const router = Router();

router.get('/perf/queries/slow', getSlowQueries);
router.get('/perf/cache/stats', getCacheStats);
router.get('/perf/engine/split', getEngineSplit);

export default router;

