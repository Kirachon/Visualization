import { Request, Response, NextFunction } from 'express';
import { streamingService } from '../services/streamingService.js';

export class StreamingController {
  async pipelines(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.STREAMING_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const start = Date.now();
      const useKafka = (process.env.STREAMING_KAFKA_ENABLE || 'false').toLowerCase() === 'true';
      try {
        if (useKafka) {
          const { createKafkaStreamingService } = await import('../services/kafkaStreamingService.js');
          const svc = createKafkaStreamingService();
          const pipelines = await svc.listPipelines();
          const dur = Date.now() - start;
          try { const { streamingApiLatency } = await import('../utils/metrics.js'); streamingApiLatency.labels('pipelines', 'ok').observe(dur); } catch {}
          res.json({ pipelines });
          return;
        }
        // Fallback to Option A (mock)
        const result = streamingService.listPipelines();
        const dur = Date.now() - start;
        try { const { streamingApiLatency } = await import('../utils/metrics.js'); streamingApiLatency.labels('pipelines', 'ok').observe(dur); } catch {}
        res.json({ pipelines: result });
      } catch (e: any) {
        const dur = Date.now() - start;
        try { const { streamingApiLatency } = await import('../utils/metrics.js'); streamingApiLatency.labels('pipelines', 'error').observe(dur); } catch {}
        if (useKafka && (e?.code === 'KAFKA_UNAVAILABLE')) {
          res.status(503).json({ error: 'Service Unavailable', message: 'Kafka not reachable. Disable STREAMING_KAFKA_ENABLE to use mock data.' });
          return;
        }
        throw e;
      }
    } catch (err) {
      try {
        const { streamingApiErrors } = await import('../utils/metrics.js');
        streamingApiErrors.labels('pipelines', 'exception').inc();
      } catch {}
      next(err);
    }
  }

  async metrics(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.STREAMING_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const start = Date.now();
      const useKafka = (process.env.STREAMING_KAFKA_ENABLE || 'false').toLowerCase() === 'true';
      try {
        if (useKafka) {
          const { createKafkaStreamingService } = await import('../services/kafkaStreamingService.js');
          const svc = createKafkaStreamingService();
          const result = await svc.getMetrics();
          const dur = Date.now() - start;
          try { const { streamingApiLatency } = await import('../utils/metrics.js'); streamingApiLatency.labels('metrics', 'ok').observe(dur); } catch {}
          res.json(result);
          return;
        }
        const result = streamingService.getMetrics();
        const dur = Date.now() - start;
        try { const { streamingApiLatency } = await import('../utils/metrics.js'); streamingApiLatency.labels('metrics', 'ok').observe(dur); } catch {}
        res.json(result);
      } catch (e: any) {
        const dur = Date.now() - start;
        try { const { streamingApiLatency } = await import('../utils/metrics.js'); streamingApiLatency.labels('metrics', 'error').observe(dur); } catch {}
        if (useKafka && (e?.code === 'KAFKA_UNAVAILABLE')) {
          res.status(503).json({ error: 'Service Unavailable', message: 'Kafka not reachable. Disable STREAMING_KAFKA_ENABLE to use mock data.' });
          return;
        }
        throw e;
      }
    } catch (err) {
      try {
        const { streamingApiErrors } = await import('../utils/metrics.js');
        streamingApiErrors.labels('metrics', 'exception').inc();
      } catch {}
      next(err);
    }
  }

  async replay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.STREAMING_REPLAY_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const start = Date.now();
      const useKafka = (process.env.STREAMING_KAFKA_ENABLE || 'false').toLowerCase() === 'true';
      try {
        if (useKafka) {
          const { createKafkaStreamingService } = await import('../services/kafkaStreamingService.js');
          const svc = createKafkaStreamingService();
          const result = await svc.requestReplay(req.body || {});
          const dur = Date.now() - start;
          try { const { streamingApiLatency } = await import('../utils/metrics.js'); streamingApiLatency.labels('replay', 'ok').observe(dur); } catch {}
          res.status(202).json(result);
          return;
        }
        const result = streamingService.requestReplay(req.body || {});
        const dur = Date.now() - start;
        try { const { streamingApiLatency } = await import('../utils/metrics.js'); streamingApiLatency.labels('replay', 'ok').observe(dur); } catch {}
        res.status(202).json(result);
      } catch (e: any) {
        const dur = Date.now() - start;
        try { const { streamingApiLatency, streamingApiErrors } = await import('../utils/metrics.js'); streamingApiLatency.labels('replay', 'error').observe(dur); streamingApiErrors.labels('replay', (e?.message || 'validation')).inc(); } catch {}
        if (useKafka && (e?.code === 'KAFKA_UNAVAILABLE')) {
          res.status(503).json({ error: 'Service Unavailable', message: 'Kafka not reachable. Disable STREAMING_KAFKA_ENABLE to use mock data.' });
          return;
        }
        res.status(400).json({ error: 'Bad Request', message: e?.message || 'Invalid request' });
      }
    } catch (err) {
      try {
        const { streamingApiErrors } = await import('../utils/metrics.js');
        streamingApiErrors.labels('replay', 'exception').inc();
      } catch {}
      next(err);
    }
  }
}

export const streamingController = new StreamingController();

