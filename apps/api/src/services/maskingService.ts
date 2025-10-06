import { query } from '../database/connection.js';
import crypto from 'crypto';

export interface MaskRule { strategy: 'full' | 'partial' | 'hash'; rule?: any }

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
      default:
        return value;
    }
  }

  async maskRows(tenantId: string, rows: any[]): Promise<any[]> {
    const rules = await this.getRules(tenantId);
    if (!rows.length || Object.keys(rules).length === 0) return rows;
    return rows.map((row) => {
      const out: any = { ...row };
      for (const col of Object.keys(row)) {
        const rule = rules[col];
        if (rule) {
          out[col] = this.applyMask(row[col], rule);
        }
      }
      return out;
    });
  }
}

export const maskingService = new MaskingService();

