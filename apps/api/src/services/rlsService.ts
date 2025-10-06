import { query } from '../database/connection.js';

export interface UserClaims {
  tenantId: string;
  department?: string | null;
  region?: string | null;
}

export interface RlsResult {
  sql: string;
  params: any[];
}

// Simple token replacement: :tenant_id, :department, :region -> parameterized values
function parameterizePredicate(predicate: string, baseIndex: number, claims: UserClaims): { text: string; values: any[] } {
  const values: any[] = [];
  let text = predicate;

  const mapping: Record<string, any> = {
    ':tenant_id': claims.tenantId,
    ':department': claims.department ?? null,
    ':region': claims.region ?? null,
  };

  let i = baseIndex;
  for (const token of Object.keys(mapping)) {
    if (text.includes(token)) {
      i += 1;
      values.push(mapping[token]);
      const placeholder = `$${i}`;
      // Replace all occurrences of the token with the placeholder
      text = text.split(token).join(placeholder);
    }
  }

  return { text, values };
}

export class RlsService {
  async apply(tenantId: string, user: UserClaims, originalSql: string, originalParams: any[] = []): Promise<RlsResult> {
    const enabled = (process.env.RLS_ENABLED || 'false').toLowerCase() === 'true';
    if (!enabled) return { sql: originalSql, params: originalParams };

    const res = await query(
      `SELECT predicate_sql FROM rls_policies WHERE tenant_id = $1 AND applies_to = 'data'`,
      [tenantId]
    );

    if (!res.rows.length) return { sql: originalSql, params: originalParams };

    // Combine all predicates with AND
    const baseIndex = originalParams.length;
    const paramValues: any[] = [];
    const parts: string[] = [];
    for (const row of res.rows as Array<{ predicate_sql: string }>) {
      const { text, values } = parameterizePredicate(row.predicate_sql, baseIndex + paramValues.length, user);
      parts.push(`(${text})`);
      paramValues.push(...values);
    }

    const rlsWhere = parts.join(' AND ');
    // Wrap original SQL safely
    const wrappedSql = `SELECT * FROM (${originalSql}) AS src WHERE ${rlsWhere}`;
    return { sql: wrappedSql, params: [...originalParams, ...paramValues] };
  }
}

export const rlsService = new RlsService();

