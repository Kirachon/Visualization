import { withRedis } from '../utils/redis.js';
import { jobDuration, jobFailures, searchIndexLag } from '../utils/metrics.js';

export async function initScheduler() {
  await withRedis(async (r) => {
    const { Queue, Worker } = await import('bullmq');

    // METADATA EXTRACTION
    if ((process.env.METADATA_EXTRACTION || 'false').toLowerCase() === 'true') {
      const q = new Queue('metadata', { connection: r as any });
      await q.add('extract', {}, { repeat: { every: parseInt(process.env.METADATA_EXTRACT_INTERVAL_MS || '900000', 10) }, removeOnComplete: true });
      new Worker('metadata', async () => {
        const start = Date.now();
        try {
          const { query } = await import('../database/connection.js');
          await query('SELECT 1');
          jobDuration.labels('metadata','_','ok').observe(Date.now() - start);
        } catch (e) { jobFailures.labels('metadata','_').inc(); throw e; }
      }, { connection: r as any });
    }

    // LINEAGE REFRESH
    if ((process.env.LINEAGE_SQL_PARSER || 'false').toLowerCase() === 'true') {
      const q = new Queue('lineage', { connection: r as any });
      await q.add('refresh', {}, { repeat: { every: parseInt(process.env.LINEAGE_REFRESH_INTERVAL_MS || '900000', 10) }, removeOnComplete: true });
      new Worker('lineage', async () => {
        const start = Date.now();
        try {
          try { const { lineageService } = await import('../services/lineageService.js'); if ((lineageService as any)?.refresh) await (lineageService as any).refresh(); } catch {}
          jobDuration.labels('lineage','_','ok').observe(Date.now() - start);
        } catch (e) { jobFailures.labels('lineage','_').inc(); throw e; }
      }, { connection: r as any });
    }

    // SEARCH CONTINUOUS INDEX
    if ((process.env.SEARCH_CONTINUOUS_INDEX || 'false').toLowerCase() === 'true') {
      const q = new Queue('search', { connection: r as any });
      await q.add('index_recent', {}, { repeat: { every: parseInt(process.env.SEARCH_INDEX_INTERVAL_MS || '300000', 10) }, removeOnComplete: true });
      new Worker('search', async () => {
        const start = Date.now();
        try {
          const { query } = await import('../database/connection.js');
          const { searchService } = await import('../services/searchService.js');
          const res = await query(`SELECT id, name, tags, attrs, EXTRACT(EPOCH FROM (NOW()-updated_at)) AS age_sec FROM metadata_assets WHERE updated_at > NOW() - INTERVAL '10 minutes' LIMIT 200`);
          for (const row of res.rows) {
            const text = `${row.name} ${(row.tags||[]).join(' ')} ${JSON.stringify(row.attrs||{})}`;
            await searchService.indexAsset(row.id, text);
            searchIndexLag.labels('_').observe((row.age_sec || 0) * 1000);
          }
          jobDuration.labels('search','_','ok').observe(Date.now() - start);
        } catch (e) { jobFailures.labels('search','_').inc(); throw e; }
      }, { connection: r as any });
    }
  }, async () => { /* no Redis: server.ts has interval fallback */ });
}

