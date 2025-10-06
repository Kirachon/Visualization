import { query } from '../database/connection.js';
import type { CreateDashboardInput, Dashboard, UpdateDashboardInput, DashboardLayout, DashboardComponent } from '../models/Dashboard.js';

function nowIso(): string { return new Date().toISOString(); }

const defaultLayout: DashboardLayout = {
  cols: 12,
  rowHeight: 100,
};

const defaultComponents: DashboardComponent[] = [];

export class DashboardService {
  async create(tenantId: string, ownerId: string, input: CreateDashboardInput): Promise<Dashboard> {
    const layout = input.layout || defaultLayout;
    const components = input.components || defaultComponents;
    const res = await query(
      `INSERT INTO dashboards (name, description, layout, components, tenant_id, owner_id, is_public, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8)
       RETURNING id, name, description, layout, components, filters, tags, tenant_id, owner_id, is_public, version, created_at, updated_at, published_at`,
      [input.name, input.description || null, JSON.stringify(layout), JSON.stringify(components), tenantId, ownerId, false, nowIso()]
    );
    return this.hydrate(res.rows[0]);
  }

  async list(tenantId: string, ownerId?: string): Promise<Dashboard[]> {
    const sql = ownerId
      ? `SELECT * FROM dashboards WHERE tenant_id = $1 AND owner_id = $2 ORDER BY created_at DESC`
      : `SELECT * FROM dashboards WHERE tenant_id = $1 ORDER BY created_at DESC`;
    const params = ownerId ? [tenantId, ownerId] : [tenantId];
    const res = await query(sql, params);
    return res.rows.map((r) => this.hydrate(r));
  }

  async getById(id: string, tenantId: string): Promise<Dashboard | null> {
    const res = await query(`SELECT * FROM dashboards WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
    if (res.rows.length === 0) return null;
    return this.hydrate(res.rows[0]);
  }

  async update(id: string, tenantId: string, input: UpdateDashboardInput): Promise<Dashboard | null> {
    const existing = await this.getById(id, tenantId);
    if (!existing) return null;

    const res = await query(
      `UPDATE dashboards SET name = COALESCE($1, name), description = COALESCE($2, description), layout = COALESCE($3, layout), components = COALESCE($4, components), is_public = COALESCE($5, is_public), updated_at = NOW()
       WHERE id = $6 AND tenant_id = $7 RETURNING *`,
      [
        input.name ?? null,
        input.description ?? null,
        input.layout ? JSON.stringify(input.layout) : null,
        input.components ? JSON.stringify(input.components) : null,
        input.isPublic ?? null,
        id,
        tenantId,
      ]
    );

    return this.hydrate(res.rows[0]);
  }

  async remove(id: string, tenantId: string): Promise<boolean> {
    const res = await query(`DELETE FROM dashboards WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
    return (res.rowCount ?? 0) > 0;
  }

  async validateDataBinding(dataSourceId: string, tenantId: string): Promise<boolean> {
    // Check if data source exists and belongs to tenant
    const res = await query(`SELECT id FROM data_sources WHERE id = $1 AND tenant_id = $2`, [dataSourceId, tenantId]);
    return res.rows.length > 0;
  }

  hydrate(row: any): Dashboard {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      layout: row.layout,
      components: row.components,
      filters: row.filters,
      tags: row.tags,
      tenantId: row.tenant_id,
      ownerId: row.owner_id,
      isPublic: row.is_public,
      version: row.version,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      publishedAt: row.published_at,
    };
  }
}

export const dashboardService = new DashboardService();

