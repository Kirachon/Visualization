import { query } from '../database/connection.js';

export interface QualityMetric {
  id: string;
  assetId: string;
  metric: string;
  value: number;
  at: Date;
}

export interface RecordMetricInput {
  assetId: string;
  metric: string;
  value: number;
}

export class DataQualityService {
  async record(input: RecordMetricInput): Promise<QualityMetric> {
    const res = await query(
      `INSERT INTO data_quality_metrics (asset_id, metric, value, at) VALUES ($1,$2,$3,NOW()) RETURNING *`,
      [input.assetId, input.metric, input.value]
    );
    return this.hydrate(res.rows[0]);
  }

  async getMetrics(assetId: string, limit = 100): Promise<QualityMetric[]> {
    const res = await query(
      `SELECT * FROM data_quality_metrics WHERE asset_id = $1 ORDER BY at DESC LIMIT $2`,
      [assetId, limit]
    );
    return res.rows.map((r) => this.hydrate(r));
  }

  hydrate(row: any): QualityMetric {
    return {
      id: row.id,
      assetId: row.asset_id,
      metric: row.metric,
      value: parseFloat(row.value),
      at: row.at,
    };
  }
}

export const dataQualityService = new DataQualityService();

