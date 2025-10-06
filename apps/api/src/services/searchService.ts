import { query } from '../database/connection.js';

export interface SearchResult {
  assetId: string;
  rank: number;
}

export class SearchService {
  async indexAsset(assetId: string, text: string): Promise<void> {
    await query(
      `INSERT INTO search_index (asset_id, tokens) VALUES ($1, to_tsvector('english', $2))
       ON CONFLICT (asset_id) DO UPDATE SET tokens = to_tsvector('english', $2)`,
      [assetId, text]
    );
  }

  async search(queryText: string, limit = 20): Promise<SearchResult[]> {
    const res = await query(
      `SELECT asset_id, ts_rank(tokens, to_tsquery('english', $1)) AS rank
       FROM search_index
       WHERE tokens @@ to_tsquery('english', $1)
       ORDER BY rank DESC
       LIMIT $2`,
      [queryText.split(/\s+/).join(' & '), limit]
    );
    return res.rows.map((r) => ({ assetId: r.asset_id, rank: parseFloat(r.rank) }));
  }
}

export const searchService = new SearchService();

