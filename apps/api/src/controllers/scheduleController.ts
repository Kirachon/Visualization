import { Request, Response, NextFunction } from 'express';
import { scheduleService } from '../services/scheduleService.js';

export class ScheduleController {
  async list(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.SCHEDULES_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const start = Date.now();
      const schedules = scheduleService.list();
      const dur = Date.now() - start;

      try {
        const { scheduleApiLatency } = await import('../utils/metrics.js');
        scheduleApiLatency.labels('list', 'ok').observe(dur);
      } catch {}

      res.json({ schedules });
    } catch (err) {
      try {
        const { scheduleApiErrors } = await import('../utils/metrics.js');
        scheduleApiErrors.labels('list', 'exception').inc();
      } catch {}
      next(err);
    }
  }

  async get(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.SCHEDULES_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const start = Date.now();
      const schedule = scheduleService.get(req.params.id);
      const dur = Date.now() - start;

      if (!schedule) {
        try {
          const { scheduleApiLatency } = await import('../utils/metrics.js');
          scheduleApiLatency.labels('get', 'not_found').observe(dur);
        } catch {}
        res.status(404).json({ error: 'Schedule not found' });
        return;
      }

      try {
        const { scheduleApiLatency } = await import('../utils/metrics.js');
        scheduleApiLatency.labels('get', 'ok').observe(dur);
      } catch {}

      res.json(schedule);
    } catch (err) {
      try {
        const { scheduleApiErrors } = await import('../utils/metrics.js');
        scheduleApiErrors.labels('get', 'exception').inc();
      } catch {}
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.SCHEDULES_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const start = Date.now();
      try {
        const schedule = scheduleService.create(req.body);
        const dur = Date.now() - start;
        try {
          const { scheduleApiLatency } = await import('../utils/metrics.js');
          scheduleApiLatency.labels('create', 'ok').observe(dur);
        } catch {}
        res.status(201).json(schedule);
      } catch (e: any) {
        const dur = Date.now() - start;
        try {
          const { scheduleApiLatency, scheduleApiErrors } = await import('../utils/metrics.js');
          scheduleApiLatency.labels('create', 'error').observe(dur);
          scheduleApiErrors.labels('create', e?.message || 'validation').inc();
        } catch {}
        res.status(400).json({ error: 'Bad Request', message: e?.message || 'Invalid input' });
      }
    } catch (err) {
      try {
        const { scheduleApiErrors } = await import('../utils/metrics.js');
        scheduleApiErrors.labels('create', 'exception').inc();
      } catch {}
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.SCHEDULES_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const start = Date.now();
      try {
        const schedule = scheduleService.update(req.params.id, req.body);
        const dur = Date.now() - start;
        try {
          const { scheduleApiLatency } = await import('../utils/metrics.js');
          scheduleApiLatency.labels('update', 'ok').observe(dur);
        } catch {}
        res.json(schedule);
      } catch (e: any) {
        const dur = Date.now() - start;
        const isNotFound = e?.message?.includes('not found');
        try {
          const { scheduleApiLatency, scheduleApiErrors } = await import('../utils/metrics.js');
          scheduleApiLatency.labels('update', isNotFound ? 'not_found' : 'error').observe(dur);
          scheduleApiErrors.labels('update', e?.message || 'validation').inc();
        } catch {}
        res.status(isNotFound ? 404 : 400).json({ error: isNotFound ? 'Not Found' : 'Bad Request', message: e?.message });
      }
    } catch (err) {
      try {
        const { scheduleApiErrors } = await import('../utils/metrics.js');
        scheduleApiErrors.labels('update', 'exception').inc();
      } catch {}
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.SCHEDULES_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const start = Date.now();
      try {
        scheduleService.delete(req.params.id);
        const dur = Date.now() - start;
        try {
          const { scheduleApiLatency } = await import('../utils/metrics.js');
          scheduleApiLatency.labels('delete', 'ok').observe(dur);
        } catch {}
        res.status(204).send();
      } catch (e: any) {
        const dur = Date.now() - start;
        const isNotFound = e?.message?.includes('not found');
        try {
          const { scheduleApiLatency, scheduleApiErrors } = await import('../utils/metrics.js');
          scheduleApiLatency.labels('delete', isNotFound ? 'not_found' : 'error').observe(dur);
          scheduleApiErrors.labels('delete', e?.message || 'error').inc();
        } catch {}
        res.status(isNotFound ? 404 : 400).json({ error: isNotFound ? 'Not Found' : 'Bad Request', message: e?.message });
      }
    } catch (err) {
      try {
        const { scheduleApiErrors } = await import('../utils/metrics.js');
        scheduleApiErrors.labels('delete', 'exception').inc();
      } catch {}
      next(err);
    }
  }

  async pause(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.SCHEDULES_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const start = Date.now();
      try {
        const schedule = scheduleService.pause(req.params.id);
        const dur = Date.now() - start;
        try {
          const { scheduleApiLatency } = await import('../utils/metrics.js');
          scheduleApiLatency.labels('pause', 'ok').observe(dur);
        } catch {}
        res.json(schedule);
      } catch (e: any) {
        const dur = Date.now() - start;
        const isNotFound = e?.message?.includes('not found');
        try {
          const { scheduleApiLatency, scheduleApiErrors } = await import('../utils/metrics.js');
          scheduleApiLatency.labels('pause', isNotFound ? 'not_found' : 'error').observe(dur);
          scheduleApiErrors.labels('pause', e?.message || 'error').inc();
        } catch {}
        res.status(isNotFound ? 404 : 400).json({ error: isNotFound ? 'Not Found' : 'Bad Request', message: e?.message });
      }
    } catch (err) {
      try {
        const { scheduleApiErrors } = await import('../utils/metrics.js');
        scheduleApiErrors.labels('pause', 'exception').inc();
      } catch {}
      next(err);
    }
  }

  async resume(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.SCHEDULES_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const start = Date.now();
      try {
        const schedule = scheduleService.resume(req.params.id);
        const dur = Date.now() - start;
        try {
          const { scheduleApiLatency } = await import('../utils/metrics.js');
          scheduleApiLatency.labels('resume', 'ok').observe(dur);
        } catch {}
        res.json(schedule);
      } catch (e: any) {
        const dur = Date.now() - start;
        const isNotFound = e?.message?.includes('not found');
        try {
          const { scheduleApiLatency, scheduleApiErrors } = await import('../utils/metrics.js');
          scheduleApiLatency.labels('resume', isNotFound ? 'not_found' : 'error').observe(dur);
          scheduleApiErrors.labels('resume', e?.message || 'error').inc();
        } catch {}
        res.status(isNotFound ? 404 : 400).json({ error: isNotFound ? 'Not Found' : 'Bad Request', message: e?.message });
      }
    } catch (err) {
      try {
        const { scheduleApiErrors } = await import('../utils/metrics.js');
        scheduleApiErrors.labels('resume', 'exception').inc();
      } catch {}
      next(err);
    }
  }

  async runNow(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.SCHEDULES_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const start = Date.now();
      try {
        const run = scheduleService.runNow(req.params.id);
        const dur = Date.now() - start;
        try {
          const { scheduleApiLatency } = await import('../utils/metrics.js');
          scheduleApiLatency.labels('run_now', 'ok').observe(dur);
        } catch {}
        res.status(202).json(run);
      } catch (e: any) {
        const dur = Date.now() - start;
        const isNotFound = e?.message?.includes('not found');
        try {
          const { scheduleApiLatency, scheduleApiErrors } = await import('../utils/metrics.js');
          scheduleApiLatency.labels('run_now', isNotFound ? 'not_found' : 'error').observe(dur);
          scheduleApiErrors.labels('run_now', e?.message || 'error').inc();
        } catch {}
        res.status(isNotFound ? 404 : 400).json({ error: isNotFound ? 'Not Found' : 'Bad Request', message: e?.message });
      }
    } catch (err) {
      try {
        const { scheduleApiErrors } = await import('../utils/metrics.js');
        scheduleApiErrors.labels('run_now', 'exception').inc();
      } catch {}
      next(err);
    }
  }
}

export const scheduleController = new ScheduleController();

