import { query } from '../database/connection.js';

export interface VulnFinding {
  id: string;
  source: string;
  severity: string;
  package?: string;
  version?: string;
  cve?: string;
  at: Date;
  status: string;
}

export interface RecordFindingInput {
  source: string;
  severity: string;
  package?: string;
  version?: string;
  cve?: string;
}

export class SecurityScanService {
  async recordFinding(input: RecordFindingInput): Promise<VulnFinding> {
    const res = await query(
      `INSERT INTO vuln_findings (source, severity, package, version, cve, at, status)
       VALUES ($1,$2,$3,$4,$5,NOW(),'open') RETURNING *`,
      [input.source, input.severity, input.package || null, input.version || null, input.cve || null]
    );
    return this.hydrate(res.rows[0]);
  }

  async listFindings(filters?: { severity?: string; status?: string }): Promise<VulnFinding[]> {
    let sql = `SELECT * FROM vuln_findings WHERE 1=1`;
    const params: any[] = [];
    if (filters?.severity) { params.push(filters.severity); sql += ` AND severity = $${params.length}`; }
    if (filters?.status) { params.push(filters.status); sql += ` AND status = $${params.length}`; }
    sql += ` ORDER BY at DESC`;
    const res = await query(sql, params);
    return res.rows.map((r) => this.hydrate(r));
  }

  hydrate(row: any): VulnFinding {
    return {
      id: row.id,
      source: row.source,
      severity: row.severity,
      package: row.package,
      version: row.version,
      cve: row.cve,
      at: row.at,
      status: row.status,
    };
  }
}

export const securityScanService = new SecurityScanService();

