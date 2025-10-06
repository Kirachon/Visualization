import { query } from '../database/connection.js';
import crypto from 'crypto';

// Feature flags (default OFF):
// - MASKING_DETERMINISTIC: enable deterministic masking using HMAC
// - MASKING_STRICT: validate rules before applying; unknown strategies ignored
// - MASKING_HMAC_KEY: secret key for HMAC-based deterministic masking

export interface MaskRule { strategy: 'full' | 'partial' | 'hash' | 'deterministic'; rule?: any }

export class MaskingService {
  async getRules(tenantId: string): Promise<Record<string, MaskRule>> {
    const enabled = (process.env.MASKING_ENABLED || 'false').toLowerCase() === 'true';
    if (!enabled) return {};
    const res = await query(
      `SELECT table_name, column_name, strategy, rule FROM column_masks WHERE tenant_id = $1`,
      [tenantId]
    );
    const map: Record<string, MaskRule> = {};
    for (const r of res.rows) {
      // Key by column_name only (minimal approach without SQL parsing)
      const key = r.column_name as string;
      map[key] = { strategy: r.strategy, rule: r.rule };
    }
    return map;
  }

  private hmac(value: string): string {
    const key = process.env.MASKING_HMAC_KEY || '';
    const enabled = (process.env.MASKING_DETERMINISTIC || 'false').toLowerCase() === 'true';
    const h = crypto.createHmac('sha256', enabled ? key : 'disabled');
    return h.update(value).digest('hex');
  }

  private validateRule(rule: MaskRule): boolean {
    const strict = (process.env.MASKING_STRICT || 'false').toLowerCase() === 'true';
    if (!strict) return true;
    const allowed = ['full','partial','hash','deterministic'];
    return allowed.includes(rule.strategy);
  }

  applyMask(value: any, rule: MaskRule): any {
    if (value === null || value === undefined) return value;
    const str = String(value);
    switch (rule.strategy) {
      case 'full':
        return '***';
      case 'partial': {
        const visiblePrefix = rule.rule?.visible_prefix ?? 0;
        const visibleSuffix = rule.rule?.visible_suffix ?? 0;
        const maskChar = rule.rule?.mask_char ?? '*';
        const maskedLen = Math.max(0, str.length - visiblePrefix - visibleSuffix);
        return `${str.slice(0, visiblePrefix)}${maskChar.repeat(maskedLen)}${str.slice(str.length - visibleSuffix)}`;
      }
      case 'hash': {
        const alg = rule.rule?.algorithm ?? 'sha256';
        return crypto.createHash(alg).update(str).digest('hex');
      }
      case 'deterministic': {
        // Deterministic pseudonymization; keep length if requested
        const digest = this.hmac(str);
        const keepLen = rule.rule?.keep_length ?? false;
        if (!keepLen) return digest;
        return digest.slice(0, Math.max(4, str.length));
      }
      default:
        return value;
    }
  }

  async maskRows(tenantId: string, rows: any[]): Promise<any[]> {
    const start = Date.now();
    const rules = await this.getRules(tenantId);
    if (!rows.length || Object.keys(rules).length === 0) return rows;
    const masked = rows.map((row) => {
      const out: any = { ...row };
      for (const col of Object.keys(row)) {
        const rule = rules[col];
        if (rule && this.validateRule(rule)) {
          out[col] = this.applyMask(row[col], rule);
        }
      }
      return out;
    });
    const dur = Date.now() - start;
    try { const { maskingLatency } = await import('../utils/metrics.js'); maskingLatency.labels(tenantId, 'ok').observe(dur); } catch {}
    return masked;
  }
}

export const maskingService = new MaskingService();

