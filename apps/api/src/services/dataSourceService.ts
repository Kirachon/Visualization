import { query } from '../database/connection.js';
import type { CreateDataSourceInput, DataSource, UpdateDataSourceInput } from '../models/DataSource.js';
import { encrypt, decrypt, type CipherText } from '../utils/encryption.js';
import { ConnectorFactory } from '../connectors/ConnectorFactory.js';
import type { ConnectionConfig } from '../connectors/IConnector.js';

function nowIso(): string { return new Date().toISOString(); }

function encCreds(password: string): CipherText { return encrypt(password); }
function decCreds(cipher: CipherText): string { return decrypt(cipher); }


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

  async testConnection(type: string, cfg: any): Promise<{ ok: boolean; error?: string }>{
    try {
      // Use connector factory for multi-database support
      const connector = ConnectorFactory.getConnector(type);
      const config: ConnectionConfig = {
        host: cfg.host,
        port: cfg.port,
        database: cfg.database,
        username: cfg.username,
        password: cfg.password,
        ssl: cfg.ssl,
      };
      const result = await connector.test(config);
      return { ok: result.success, error: result.error };
    } catch (e: any) {
      return { ok: false, error: e.message };
    }
  }

  async discoverSchema(ds: DataSource): Promise<any[]> {
    try {
      // Decrypt password if needed
      const rawCfg = ds.connectionConfig as any;
      const password = typeof rawCfg.password === 'object' ? decCreds(rawCfg.password as CipherText) : rawCfg.password;

      // Use connector factory for multi-database support
      const connector = ConnectorFactory.getConnector(ds.type);
      const config: ConnectionConfig = {
        host: rawCfg.host,
        port: rawCfg.port,
        database: rawCfg.database,
        username: rawCfg.username,
        password: password,
        ssl: rawCfg.ssl,
      };

      const schemaInfo = await connector.introspect(config);

      // Flatten schema info for persistence
      const rows: any[] = [];
      for (const schema of schemaInfo.schemas) {
        for (const table of schema.tables) {
          for (const column of table.columns) {
            rows.push({
              schema_name: schema.schemaName,
              table_name: table.tableName,
              column_name: column.columnName,
              data_type: column.dataType,
              is_nullable: column.isNullable,
              column_default: column.defaultValue,
            });
          }
        }
      }

      // Persist snapshot
      await query('DELETE FROM data_source_schemas WHERE data_source_id = $1', [ds.id]);
      const inserts = rows.map((r) =>
        query(
          `INSERT INTO data_source_schemas (data_source_id, schema_name, table_name, column_name, data_type, is_nullable, column_default)
           VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,
          [ds.id, r.schema_name, r.table_name, r.column_name, r.data_type, r.is_nullable, r.column_default]
        )
      );
      await Promise.all(inserts);
      await query('UPDATE data_sources SET schema_info = $1, updated_at = NOW() WHERE id = $2', [JSON.stringify({ at: nowIso(), columns: rows.length }), ds.id]);

      return rows;
    } catch (error: any) {
      throw new Error(`Failed to discover schema: ${error.message}`);
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

