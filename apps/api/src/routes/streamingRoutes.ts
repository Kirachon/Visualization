import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { streamingController } from '../controllers/streamingController.js';

const router = Router();

// Lightweight limiter for replay endpoint (defense-in-depth)
const replayLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many replay requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/streaming/pipelines', streamingController.pipelines.bind(streamingController));
router.get('/streaming/metrics', streamingController.metrics.bind(streamingController));
router.post('/streaming/replay', replayLimiter, streamingController.replay.bind(streamingController));

export default router;

