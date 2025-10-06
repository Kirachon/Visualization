import { query } from '../database/connection.js';
import type { CreateDataSourceInput, DataSource, UpdateDataSourceInput } from '../models/DataSource.js';
import { encrypt, decrypt, type CipherText } from '../utils/encryption.js';
import { Pool } from 'pg';

function nowIso(): string { return new Date().toISOString(); }

function encCreds(password: string): CipherText { return encrypt(password); }
function decCreds(cipher: CipherText): string { return decrypt(cipher); }

function buildPgConnStr(cfg: any, password?: string): string {
  const pass = password ?? cfg.password;
  const ssl = cfg.ssl ? '?sslmode=require' : '';
  return `postgresql://${encodeURIComponent(cfg.username)}:${encodeURIComponent(pass)}@${cfg.host}:${cfg.port}/${cfg.database}${ssl}`;
}

export class DataSourceService {
  async create(tenantId: string, ownerId: string, input: CreateDataSourceInput): Promise<DataSource> {
    const passwordCipher = encCreds(input.connectionConfig.password);

    const res = await query(
      `INSERT INTO data_sources (name, type, connection_config, tenant_id, owner_id, status, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$7)
       RETURNING id, name, type, connection_config, tenant_id, owner_id, schema_info, status, last_tested_at, created_at, updated_at`,
      [
        input.name,
        input.type,
        JSON.stringify({
          ...input.connectionConfig,
          password: passwordCipher,
        }),
        tenantId,
        ownerId,
        'active',
        nowIso(),
      ]
    );

    const row = res.rows[0];
    return this.hydrate(row);
  }

  async list(tenantId: string): Promise<DataSource[]> {
    const res = await query(`SELECT * FROM data_sources WHERE tenant_id = $1 ORDER BY created_at DESC`, [tenantId]);
    return res.rows.map((r) => this.hydrate(r));
  }

  async getById(id: string, tenantId: string): Promise<DataSource | null> {
    const res = await query(`SELECT * FROM data_sources WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
    if (res.rows.length === 0) return null;
    return this.hydrate(res.rows[0]);
  }

  async update(id: string, tenantId: string, input: UpdateDataSourceInput): Promise<DataSource | null> {
    const existing = await this.getById(id, tenantId);
    if (!existing) return null;

    const mergedCfg = { ...existing.connectionConfig, ...input.connectionConfig } as any;
    if (input.connectionConfig?.password) {
      mergedCfg.password = encCreds(input.connectionConfig.password);
    }

    const res = await query(
      `UPDATE data_sources SET name = COALESCE($1, name), connection_config = COALESCE($2, connection_config), status = COALESCE($3, status), updated_at = NOW()
       WHERE id = $4 AND tenant_id = $5 RETURNING *`,
      [input.name ?? null, input.connectionConfig ? JSON.stringify(mergedCfg) : null, input.status ?? null, id, tenantId]
    );

    return this.hydrate(res.rows[0]);
  }

  async remove(id: string, tenantId: string): Promise<boolean> {
    const res = await query(`DELETE FROM data_sources WHERE id = $1 AND tenant_id = $2`, [id, tenantId]);
    return (res.rowCount ?? 0) > 0;
  }

  async testConnection(cfg: any): Promise<{ ok: boolean; error?: string }>{
    try {
      const connStr = buildPgConnStr(cfg);
      const pool = new Pool({ connectionString: connStr, max: 1, connectionTimeoutMillis: 2000 });
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      await pool.end();
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }

  async discoverSchema(ds: DataSource): Promise<any[]> {
    // Decrypt password if needed
    const rawCfg = ds.connectionConfig as any;
    const password = typeof rawCfg.password === 'object' ? decCreds(rawCfg.password as CipherText) : rawCfg.password;
    const connStr = buildPgConnStr(rawCfg, password);
    const pool = new Pool({ connectionString: connStr, max: 1, connectionTimeoutMillis: 5000 });
    const client = await pool.connect();
    try {
      const q = `SELECT table_schema, table_name, column_name, data_type, is_nullable, column_default
                 FROM information_schema.columns
                 WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
                 ORDER BY table_schema, table_name, ordinal_position`;
      const res = await client.query(q);

      // Persist snapshot
      await query('DELETE FROM data_source_schemas WHERE data_source_id = $1', [ds.id]);
      const inserts = res.rows.map((r) =>
        query(
          `INSERT INTO data_source_schemas (data_source_id, schema_name, table_name, column_name, data_type, is_nullable, column_default)
           VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,
          [ds.id, r.table_schema, r.table_name, r.column_name, r.data_type, r.is_nullable === 'YES', r.column_default]
        )
      );
      await Promise.all(inserts);
      await query('UPDATE data_sources SET schema_info = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify({ at: nowIso(), columns: res.rowCount }), ds.id]);

      return res.rows;
    } finally {
      client.release();
      await pool.end();
    }
  }

  async resolveConnectionConfigById(id: string, tenantId: string): Promise<any | null> {
    const ds = await this.getById(id, tenantId);
    if (!ds) return null;
    const rawCfg = ds.connectionConfig as any;
    const password = typeof rawCfg.password === 'object' ? decCreds(rawCfg.password as CipherText) : rawCfg.password;
    return { ...rawCfg, password };
  }

  hydrate(row: any): DataSource {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      connectionConfig: row.connection_config,
      tenantId: row.tenant_id,
      ownerId: row.owner_id,
      schemaInfo: row.schema_info,
      status: row.status,
      lastTestedAt: row.last_tested_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const dataSourceService = new DataSourceService();

