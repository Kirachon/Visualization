import { query } from '../database/connection.js';

export interface DashboardVersion {
  id: string;
  dashboardId: string;
  version: number;
  diff: any;
  label?: string;
  authorId?: string;
  createdAt: Date;
}

export interface CreateVersionInput {
  dashboardId: string;
  diff: any;
  label?: string;
  authorId?: string;
}

export class VersionService {
  async create(input: CreateVersionInput): Promise<DashboardVersion> {
    const versionRes = await query(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next_version FROM dashboard_versions WHERE dashboard_id = $1`,
      [input.dashboardId]
    );
    const nextVersion = versionRes.rows[0].next_version;
    const res = await query(
      `INSERT INTO dashboard_versions (dashboard_id, version, diff, label, author_id, created_at)
       VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *`,
      [input.dashboardId, nextVersion, JSON.stringify(input.diff), input.label || null, input.authorId || null]
    );
    return this.hydrate(res.rows[0]);
  }

  async list(dashboardId: string): Promise<DashboardVersion[]> {
    const res = await query(
      `SELECT * FROM dashboard_versions WHERE dashboard_id = $1 ORDER BY version DESC`,
      [dashboardId]
    );
    return res.rows.map((r) => this.hydrate(r));
  }

  async getById(id: string): Promise<DashboardVersion | null> {
    const res = await query(`SELECT * FROM dashboard_versions WHERE id = $1`, [id]);
    if (res.rows.length === 0) return null;
    return this.hydrate(res.rows[0]);
  }

  async restore(versionId: string, tenantId: string, actorUserId: string): Promise<{ dashboardId: string; applied: any } | null> {
    // Fetch version and associated diff
    const vRes = await query(`SELECT * FROM dashboard_versions WHERE id = $1`, [versionId]);
    if (vRes.rows.length === 0) return null;
    const v = this.hydrate(vRes.rows[0]);

    // Derive fields to apply; support either { snapshot: { ...fields } } or diff with top-level fields
    const src: any = (v.diff && (v.diff.snapshot || v.diff)) || {};
    const fields = {
      name: src.name ?? null,
      description: src.description ?? null,
      layout: src.layout ?? null,
      components: src.components ?? null,
    };

    // Apply to dashboard when provided
    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;
    if (fields.name !== null) { sets.push(`name = $${idx++}`); params.push(fields.name); }
    if (fields.description !== null) { sets.push(`description = $${idx++}`); params.push(fields.description); }
    if (fields.layout !== null) { sets.push(`layout = $${idx++}`); params.push(JSON.stringify(fields.layout)); }
    if (fields.components !== null) { sets.push(`components = $${idx++}`); params.push(JSON.stringify(fields.components)); }

    if (sets.length === 0) {
      // Nothing to apply; treat as no-op restore
      return { dashboardId: v.dashboardId, applied: {} };
    }

    // WHERE clause
    params.push(v.dashboardId); const dashIdx = idx++;
    params.push(tenantId); const tenantIdx = idx++;

    const sql = `UPDATE dashboards SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${dashIdx} AND tenant_id = $${tenantIdx} RETURNING id`;
    await query(sql, params);

    // Optionally record activity (best-effort)
    try {
      const { activityService } = await import('./activityService.js');
      await activityService.create({ dashboardId: v.dashboardId, type: 'dashboard.restored', actorId: actorUserId, details: { versionId } });
    } catch {}

    return { dashboardId: v.dashboardId, applied: fields };
  }


  hydrate(row: any): DashboardVersion {
    return {
      id: row.id,
      dashboardId: row.dashboard_id,
      version: row.version,
      diff: row.diff,
      label: row.label,
      authorId: row.author_id,
      createdAt: row.created_at,
    };
  }
}

export const versionService = new VersionService();

