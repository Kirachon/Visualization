import { Router } from 'express';
import { metricsText } from '../utils/metrics.js';

const router = Router();

router.get('/metrics', async (_req, res) => {
  try {
    const text = await metricsText();
    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(text);
  } catch (e:any) {
    res.status(500).send(`# metrics error: ${e?.message || 'unknown'}`);
  }
});

export default router;

