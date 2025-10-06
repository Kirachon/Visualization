import { query } from '../database/connection.js';

export interface MetadataAsset {
  id: string;
  type: string;
  name: string;
  ownerId?: string;
  tags: string[];
  attrs: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAssetInput {
  type: string;
  name: string;
  ownerId?: string;
  tags?: string[];
  attrs?: any;
}

export class MetadataService {
  async createAsset(input: CreateAssetInput): Promise<MetadataAsset> {
    const res = await query(
      `INSERT INTO metadata_assets (type, name, owner_id, tags, attrs, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,NOW(),NOW()) RETURNING *`,
      [input.type, input.name, input.ownerId || null, JSON.stringify(input.tags || []), JSON.stringify(input.attrs || {})]
    );
    return this.hydrateAsset(res.rows[0]);
  }

  async listAssets(filters: { type?: string; ownerId?: string }): Promise<MetadataAsset[]> {
    let sql = `SELECT * FROM metadata_assets WHERE 1=1`;
    const params: any[] = [];
    if (filters.type) { params.push(filters.type); sql += ` AND type = $${params.length}`; }
    if (filters.ownerId) { params.push(filters.ownerId); sql += ` AND owner_id = $${params.length}`; }
    sql += ` ORDER BY created_at DESC`;
    const res = await query(sql, params);
    return res.rows.map((r) => this.hydrateAsset(r));
  }

  async getAssetById(id: string): Promise<MetadataAsset | null> {
    const res = await query(`SELECT * FROM metadata_assets WHERE id = $1`, [id]);
    if (res.rows.length === 0) return null;
    return this.hydrateAsset(res.rows[0]);
  }

  hydrateAsset(row: any): MetadataAsset {
    return {
      id: row.id,
      type: row.type,
      name: row.name,
      ownerId: row.owner_id,
      tags: row.tags || [],
      attrs: row.attrs || {},
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const metadataService = new MetadataService();

