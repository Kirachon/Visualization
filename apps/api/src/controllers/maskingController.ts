import { Request, Response, NextFunction } from 'express';
import { maskingService } from '../services/maskingService.js';

export class MaskingController {
  async dryRun(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId || req.body.tenantId;
      const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
      const masked = await maskingService.maskRows(tenantId, rows);
      res.json({ rows: masked });
    } catch (err) { next(err); }
  }

  async validateConfig(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Gate endpoint with MASKING_STRICT to avoid exposing internals by default
      if ((process.env.MASKING_STRICT || 'false').toLowerCase() !== 'true') { res.status(404).end(); return; }
      const tenantId = (req as any).user?.tenantId || req.body.tenantId;
      const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
      const inputRules = Array.isArray(req.body?.rules) ? req.body.rules : [];
      const roles: string[] = Array.isArray(req.body?.roles) ? req.body.roles : [];

      type InRule = { column: string; strategy: string; rule?: any; roles?: string[] };
      const allowed = new Set(['full','partial','hash','deterministic']);

      // Validation and precedence normalization
      const errors: string[] = [];
      const perColumn: Record<string, InRule[]> = {};
      for (const r of inputRules as InRule[]) {
        if (!r || typeof r.column !== 'string' || !r.strategy) {
          errors.push('Invalid rule: missing column/strategy');
          continue;
        }
        if (!allowed.has(r.strategy)) {
          errors.push(`Unsupported strategy: ${r.strategy} for ${r.column}`);
          continue;
        }
        perColumn[r.column] = perColumn[r.column] || [];
        perColumn[r.column].push(r);
      }

      // ASSUMPTION: Precedence order full > deterministic > hash > partial
      const order = ['partial','hash','deterministic','full'];
      const normalized: Record<string, { strategy: string; rule?: any }> = {};
      for (const [col, rules] of Object.entries(perColumn)) {
        // Filter by user roles if roles declared; otherwise global
        const applicable = rules.filter(r => !r.roles || r.roles.length === 0 || r.roles.some(rr => roles.includes(rr)));
        const pick = applicable.sort((a,b) => order.indexOf(a.strategy) - order.indexOf(b.strategy)).pop();
        if (pick) normalized[col] = { strategy: pick.strategy, rule: pick.rule };
      }

      // Increment metrics for errors
      if (errors.length) {
        try {
          const { maskingConfigErrors } = await import('../utils/metrics.js');
          maskingConfigErrors.labels(tenantId || 'unknown').inc(errors.length);
        } catch {}
      }

      // Dry-run with normalized config
      const maskedRows = rows.map((row: any) => {
        const out: any = { ...row };
        for (const [col, rule] of Object.entries(normalized)) {
          if (col in row) {
            // Reuse service applyMask()
            out[col] = (maskingService as any).applyMask(row[col], rule);
          }
        }
        return out;
      });

      res.json({ normalizedConfig: normalized, errors, rows: maskedRows });
    } catch (err) { next(err); }
  }

}

export const maskingController = new MaskingController();

