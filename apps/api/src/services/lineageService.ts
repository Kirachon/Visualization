import { query } from '../database/connection.js';

export interface LineageEdge {
  id: string;
  srcAssetId: string;
  dstAssetId: string;
  edge: any;
  createdAt: Date;
}

export interface CreateLineageInput {
  srcAssetId: string;
  dstAssetId: string;
  edge?: any;
}

export class LineageService {
  async createEdge(input: CreateLineageInput): Promise<LineageEdge> {
    const res = await query(
      `INSERT INTO metadata_lineage (src_asset_id, dst_asset_id, edge, created_at)
       VALUES ($1,$2,$3,NOW()) RETURNING *`,
      [input.srcAssetId, input.dstAssetId, JSON.stringify(input.edge || {})]
    );
    return this.hydrateEdge(res.rows[0]);
  }

  async getLineage(assetId: string): Promise<{ upstream: LineageEdge[]; downstream: LineageEdge[] }> {
    const upRes = await query(`SELECT * FROM metadata_lineage WHERE dst_asset_id = $1`, [assetId]);
    const downRes = await query(`SELECT * FROM metadata_lineage WHERE src_asset_id = $1`, [assetId]);
    return {
      upstream: upRes.rows.map((r) => this.hydrateEdge(r)),
      downstream: downRes.rows.map((r) => this.hydrateEdge(r)),
    };
  }

  hydrateEdge(row: any): LineageEdge {
    return {
      id: row.id,
      srcAssetId: row.src_asset_id,
      dstAssetId: row.dst_asset_id,
      edge: row.edge,
      createdAt: row.created_at,
    };
  }
}

export const lineageService = new LineageService();

