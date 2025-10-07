import { Request, Response, NextFunction } from 'express';
import { dqService } from '../services/dqService.js';

export class DQController {
  async listRules(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.DQ_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const assetId = req.query.assetId as string | undefined;
      const start = Date.now();
      const rules = dqService.listRules(assetId);
      const dur = Date.now() - start;

      try {
        const { dqApiLatency } = await import('../utils/metrics.js');
        dqApiLatency.labels('list_rules', 'ok').observe(dur);
      } catch {}

      res.json({ rules });
    } catch (err) {
      try {
        const { dqApiErrors } = await import('../utils/metrics.js');
        dqApiErrors.labels('list_rules', 'exception').inc();
      } catch {}
      next(err);
    }
  }

  async getRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.DQ_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const start = Date.now();
      const rule = dqService.getRule(req.params.id);
      const dur = Date.now() - start;

      if (!rule) {
        try {
          const { dqApiLatency } = await import('../utils/metrics.js');
          dqApiLatency.labels('get_rule', 'not_found').observe(dur);
        } catch {}
        res.status(404).json({ error: 'Rule not found' });
        return;
      }

      try {
        const { dqApiLatency } = await import('../utils/metrics.js');
        dqApiLatency.labels('get_rule', 'ok').observe(dur);
      } catch {}

      res.json(rule);
    } catch (err) {
      try {
        const { dqApiErrors } = await import('../utils/metrics.js');
        dqApiErrors.labels('get_rule', 'exception').inc();
      } catch {}
      next(err);
    }
  }

  async createRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.DQ_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const start = Date.now();
      try {
        const rule = dqService.createRule(req.body);
        const dur = Date.now() - start;
        try {
          const { dqApiLatency } = await import('../utils/metrics.js');
          dqApiLatency.labels('create_rule', 'ok').observe(dur);
        } catch {}
        res.status(201).json(rule);
      } catch (e: any) {
        const dur = Date.now() - start;
        try {
          const { dqApiLatency, dqApiErrors } = await import('../utils/metrics.js');
          dqApiLatency.labels('create_rule', 'error').observe(dur);
          dqApiErrors.labels('create_rule', e?.message || 'validation').inc();
        } catch {}
        res.status(400).json({ error: 'Bad Request', message: e?.message || 'Invalid input' });
      }
    } catch (err) {
      try {
        const { dqApiErrors } = await import('../utils/metrics.js');
        dqApiErrors.labels('create_rule', 'exception').inc();
      } catch {}
      next(err);
    }
  }

  async updateRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.DQ_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const start = Date.now();
      try {
        const rule = dqService.updateRule(req.params.id, req.body);
        const dur = Date.now() - start;
        try {
          const { dqApiLatency } = await import('../utils/metrics.js');
          dqApiLatency.labels('update_rule', 'ok').observe(dur);
        } catch {}
        res.json(rule);
      } catch (e: any) {
        const dur = Date.now() - start;
        const isNotFound = e?.message?.includes('not found');
        try {
          const { dqApiLatency, dqApiErrors } = await import('../utils/metrics.js');
          dqApiLatency.labels('update_rule', isNotFound ? 'not_found' : 'error').observe(dur);
          dqApiErrors.labels('update_rule', e?.message || 'validation').inc();
        } catch {}
        res.status(isNotFound ? 404 : 400).json({ error: isNotFound ? 'Not Found' : 'Bad Request', message: e?.message });
      }
    } catch (err) {
      try {
        const { dqApiErrors } = await import('../utils/metrics.js');
        dqApiErrors.labels('update_rule', 'exception').inc();
      } catch {}
      next(err);
    }
  }

  async deleteRule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.DQ_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const start = Date.now();
      try {
        dqService.deleteRule(req.params.id);
        const dur = Date.now() - start;
        try {
          const { dqApiLatency } = await import('../utils/metrics.js');
          dqApiLatency.labels('delete_rule', 'ok').observe(dur);
        } catch {}
        res.status(204).send();
      } catch (e: any) {
        const dur = Date.now() - start;
        const isNotFound = e?.message?.includes('not found');
        try {
          const { dqApiLatency, dqApiErrors } = await import('../utils/metrics.js');
          dqApiLatency.labels('delete_rule', isNotFound ? 'not_found' : 'error').observe(dur);
          dqApiErrors.labels('delete_rule', e?.message || 'error').inc();
        } catch {}
        res.status(isNotFound ? 404 : 400).json({ error: isNotFound ? 'Not Found' : 'Bad Request', message: e?.message });
      }
    } catch (err) {
      try {
        const { dqApiErrors } = await import('../utils/metrics.js');
        dqApiErrors.labels('delete_rule', 'exception').inc();
      } catch {}
      next(err);
    }
  }

  async listResults(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.DQ_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const assetId = req.query.assetId as string | undefined;
      const ruleId = req.query.ruleId as string | undefined;
      const start = Date.now();
      const results = dqService.listResults(assetId, ruleId);
      const dur = Date.now() - start;

      try {
        const { dqApiLatency } = await import('../utils/metrics.js');
        dqApiLatency.labels('list_results', 'ok').observe(dur);
      } catch {}

      res.json({ results });
    } catch (err) {
      try {
        const { dqApiErrors } = await import('../utils/metrics.js');
        dqApiErrors.labels('list_results', 'exception').inc();
      } catch {}
      next(err);
    }
  }

  async listProfiles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.DQ_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const assetId = req.query.assetId as string | undefined;
      const start = Date.now();
      const profiles = dqService.listProfiles(assetId);
      const dur = Date.now() - start;

      try {
        const { dqApiLatency } = await import('../utils/metrics.js');
        dqApiLatency.labels('list_profiles', 'ok').observe(dur);
      } catch {}

      res.json({ profiles });
    } catch (err) {
      try {
        const { dqApiErrors } = await import('../utils/metrics.js');
        dqApiErrors.labels('list_profiles', 'exception').inc();
      } catch {}
      next(err);
    }
  }

  async listScores(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const enabled = (process.env.DQ_API_ENABLE || 'false').toLowerCase() === 'true';
      if (!enabled) { res.status(404).json({ error: 'Not Found' }); return; }

      const assetId = req.query.assetId as string | undefined;
      const start = Date.now();
      const scores = dqService.listScores(assetId);
      const dur = Date.now() - start;

      try {
        const { dqApiLatency } = await import('../utils/metrics.js');
        dqApiLatency.labels('list_scores', 'ok').observe(dur);
      } catch {}

      res.json({ scores });
    } catch (err) {
      try {
        const { dqApiErrors } = await import('../utils/metrics.js');
        dqApiErrors.labels('list_scores', 'exception').inc();
      } catch {}
      next(err);
    }
  }
}

export const dqController = new DQController();

