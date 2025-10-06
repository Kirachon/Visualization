import { query } from '../database/connection.js';

export interface ImpactRecord {
  id: string;
  changeRef: string;
  impactedAssetId: string;
  details: any;
  at: Date;
}

export interface AnalyzeImpactInput {
  changeRef: string;
  impactedAssetIds: string[];
  details?: any;
}

export class ImpactService {
  async analyze(input: AnalyzeImpactInput): Promise<ImpactRecord[]> {
    const records: ImpactRecord[] = [];
    for (const assetId of input.impactedAssetIds) {
      const res = await query(
        `INSERT INTO impact_records (change_ref, impacted_asset_id, details, at) VALUES ($1,$2,$3,NOW()) RETURNING *`,
        [input.changeRef, assetId, JSON.stringify(input.details || {})]
      );
      records.push(this.hydrate(res.rows[0]));
    }
    return records;
  }

  async getImpacts(changeRef: string): Promise<ImpactRecord[]> {
    const res = await query(`SELECT * FROM impact_records WHERE change_ref = $1 ORDER BY at DESC`, [changeRef]);
    return res.rows.map((r) => this.hydrate(r));
  }

  hydrate(row: any): ImpactRecord {
    return {
      id: row.id,
      changeRef: row.change_ref,
      impactedAssetId: row.impacted_asset_id,
      details: row.details,
      at: row.at,
    };
  }
}

export const impactService = new ImpactService();

