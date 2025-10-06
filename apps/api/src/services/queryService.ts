import { Pool } from 'pg';
import { decrypt, type CipherText } from '../utils/encryption.js';
import { rlsService, type UserClaims } from './rlsService.js';
import { maskingService } from './maskingService.js';

export interface ExecuteQueryInput {
  connectionConfig: any; // decrypted or cipher
  sql: string;
  params?: unknown[];
  limit?: number;
  offset?: number;
  timeoutMs?: number;
  tenantId?: string;
  userClaims?: UserClaims;
}

function resolvePassword(cfg: any): string {
  const p = cfg.password;
  if (typeof p === 'object' && p && 'iv' in p && 'ct' in p) {
    return decrypt(p as CipherText);
  }
  return p;
}

function buildConnStr(cfg: any, password?: string): string {
  const pass = password ?? cfg.password;
  const ssl = cfg.ssl ? '?sslmode=require' : '';
  return `postgresql://${encodeURIComponent(cfg.username)}:${encodeURIComponent(pass)}@${cfg.host}:${cfg.port}/${cfg.database}${ssl}`;
}

export class QueryService {
  async execute(input: ExecuteQueryInput): Promise<{ rows: any[]; rowCount: number; durationMs: number }>{
    const password = resolvePassword(input.connectionConfig);
    const connStr = buildConnStr(input.connectionConfig, password);
    const pool = new Pool({ connectionString: connStr, max: 1, statement_timeout: input.timeoutMs ?? 30000 });
    const client = await pool.connect();
    const start = Date.now();
    try {
      // Apply RLS (feature-flagged) by wrapping original SQL
      let effectiveSql = input.sql;
      let effectiveParams = input.params ?? [];
      if (input.tenantId && input.userClaims) {
        const r = await rlsService.apply(input.tenantId, input.userClaims, effectiveSql, effectiveParams);
        effectiveSql = r.sql;
        effectiveParams = r.params;
      }

      const limitedSql = input.limit ? `${effectiveSql} LIMIT ${input.limit} OFFSET ${input.offset ?? 0}` : effectiveSql;
      const res = await client.query(limitedSql, effectiveParams);
      const rowCount = (res.rowCount ?? 0) as number;

      // Column masking (feature-flagged)
      let rows = res.rows;
      if (input.tenantId) {
        rows = await maskingService.maskRows(input.tenantId, rows);
      }

      return { rows, rowCount, durationMs: Date.now() - start };
    } finally {
      client.release();
      await pool.end();
    }
  }
}

export const queryService = new QueryService();

