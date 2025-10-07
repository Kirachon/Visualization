import { Request, Response, NextFunction } from 'express';
import { alertService } from '../services/alertService.js';

export class AlertController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.ALERTS_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const tenantId = (req as any).user?.tenantId || 'default';
      const start = Date.now();
      const alerts = alertService.list(tenantId);
      const dur = Date.now() - start;

      try {
        const { alertApiLatency } = await import('../utils/metrics.js');
        alertApiLatency.labels('list', 'ok').observe(dur);
      } catch {}

      res.json({ alerts });
    } catch (err) {
      try {
        const { alertApiErrors } = await import('../utils/metrics.js');
        alertApiErrors.labels('list', 'exception').inc();
      } catch {}
      next(err);
    }
  }

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.ALERTS_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const tenantId = (req as any).user?.tenantId || 'default';
      const start = Date.now();
      const alert = alertService.get(req.params.id, tenantId);
      const dur = Date.now() - start;

      if (!alert) {
        try {
          const { alertApiLatency } = await import('../utils/metrics.js');
          alertApiLatency.labels('get', 'not_found').observe(dur);
        } catch {}
        res.status(404).json({ error: 'Alert not found' });
        return;
      }

      try {
        const { alertApiLatency } = await import('../utils/metrics.js');
        alertApiLatency.labels('get', 'ok').observe(dur);
      } catch {}

      res.json(alert);
    } catch (err) {
      try {
        const { alertApiErrors } = await import('../utils/metrics.js');
        alertApiErrors.labels('get', 'exception').inc();
      } catch {}
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.ALERTS_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const tenantId = (req as any).user?.tenantId || 'default';
      const start = Date.now();
      try {
        const alert = alertService.create({ ...req.body, tenantId });
        const dur = Date.now() - start;
        try {
          const { alertApiLatency } = await import('../utils/metrics.js');
          alertApiLatency.labels('create', 'ok').observe(dur);
        } catch {}
        res.status(201).json(alert);
      } catch (e: any) {
        const dur = Date.now() - start;
        try {
          const { alertApiLatency, alertApiErrors } = await import('../utils/metrics.js');
          alertApiLatency.labels('create', 'error').observe(dur);
          alertApiErrors.labels('create', e?.message || 'validation').inc();
        } catch {}
        res.status(400).json({ error: 'Bad Request', message: e?.message || 'Invalid input' });
      }
    } catch (err) {
      try {
        const { alertApiErrors } = await import('../utils/metrics.js');
        alertApiErrors.labels('create', 'exception').inc();
      } catch {}
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.ALERTS_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const tenantId = (req as any).user?.tenantId || 'default';
      const start = Date.now();
      try {
        const alert = alertService.update(req.params.id, tenantId, req.body);
        const dur = Date.now() - start;
        try {
          const { alertApiLatency } = await import('../utils/metrics.js');
          alertApiLatency.labels('update', 'ok').observe(dur);
        } catch {}
        res.json(alert);
      } catch (e: any) {
        const dur = Date.now() - start;
        const isNotFound = e?.message?.includes('not found');
        try {
          const { alertApiLatency, alertApiErrors } = await import('../utils/metrics.js');
          alertApiLatency.labels('update', isNotFound ? 'not_found' : 'error').observe(dur);
          alertApiErrors.labels('update', e?.message || 'validation').inc();
        } catch {}
        res.status(isNotFound ? 404 : 400).json({ error: isNotFound ? 'Not Found' : 'Bad Request', message: e?.message });
      }
    } catch (err) {
      try {
        const { alertApiErrors } = await import('../utils/metrics.js');
        alertApiErrors.labels('update', 'exception').inc();
      } catch {}
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.ALERTS_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const tenantId = (req as any).user?.tenantId || 'default';
      const start = Date.now();
      try {
        alertService.delete(req.params.id, tenantId);
        const dur = Date.now() - start;
        try {
          const { alertApiLatency } = await import('../utils/metrics.js');
          alertApiLatency.labels('delete', 'ok').observe(dur);
        } catch {}
        res.status(204).send();
      } catch (e: any) {
        const dur = Date.now() - start;
        const isNotFound = e?.message?.includes('not found');
        try {
          const { alertApiLatency, alertApiErrors } = await import('../utils/metrics.js');
          alertApiLatency.labels('delete', isNotFound ? 'not_found' : 'error').observe(dur);
          alertApiErrors.labels('delete', e?.message || 'error').inc();
        } catch {}
        res.status(isNotFound ? 404 : 400).json({ error: isNotFound ? 'Not Found' : 'Bad Request', message: e?.message });
      }
    } catch (err) {
      try {
        const { alertApiErrors } = await import('../utils/metrics.js');
        alertApiErrors.labels('delete', 'exception').inc();
      } catch {}
      next(err);
    }
  }

  async test(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.ALERTS_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const tenantId = (req as any).user?.tenantId || 'default';
      const start = Date.now();
      try {
        const result = alertService.test(req.params.id, tenantId);
        const dur = Date.now() - start;
        try {
          const { alertApiLatency } = await import('../utils/metrics.js');
          alertApiLatency.labels('test', 'ok').observe(dur);
        } catch {}
        res.json(result);
      } catch (e: any) {
        const dur = Date.now() - start;
        const isNotFound = e?.message?.includes('not found');
        try {
          const { alertApiLatency, alertApiErrors } = await import('../utils/metrics.js');
          alertApiLatency.labels('test', isNotFound ? 'not_found' : 'error').observe(dur);
          alertApiErrors.labels('test', e?.message || 'error').inc();
        } catch {}
        res.status(isNotFound ? 404 : 400).json({ error: isNotFound ? 'Not Found' : 'Bad Request', message: e?.message });
      }
    } catch (err) {
      try {
        const { alertApiErrors } = await import('../utils/metrics.js');
        alertApiErrors.labels('test', 'exception').inc();
      } catch {}
      next(err);
    }
  }

  async history(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.ALERTS_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const tenantId = (req as any).user?.tenantId || 'default';
      const start = Date.now();
      try {
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
        const events = alertService.getHistory(req.params.id, tenantId, limit);
        const dur = Date.now() - start;
        try {
          const { alertApiLatency } = await import('../utils/metrics.js');
          alertApiLatency.labels('history', 'ok').observe(dur);
        } catch {}
        res.json({ events });
      } catch (e: any) {
        const dur = Date.now() - start;
        const isNotFound = e?.message?.includes('not found');
        try {
          const { alertApiLatency, alertApiErrors } = await import('../utils/metrics.js');
          alertApiLatency.labels('history', isNotFound ? 'not_found' : 'error').observe(dur);
          alertApiErrors.labels('history', e?.message || 'error').inc();
        } catch {}
        res.status(isNotFound ? 404 : 400).json({ error: isNotFound ? 'Not Found' : 'Bad Request', message: e?.message });
      }
    } catch (err) {
      try {
        const { alertApiErrors } = await import('../utils/metrics.js');
        alertApiErrors.labels('history', 'exception').inc();
      } catch {}
      next(err);
    }
  }
}

export const alertController = new AlertController();

