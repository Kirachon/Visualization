import request from 'supertest';
import { app, server } from '../../server.js';
import { perfService } from '../../services/perfService.js';

describe('Perf engine split endpoint', () => {
  const agent = request.agent(app);
  afterAll((done) => { server.close(done); });

  it('returns engine split counts for recent window', async () => {
    // clear any prior state by recording nothing special; service is in-memory only
    const since = 60000; // 1 minute

    // Initial call should be zeros
    const r0 = await agent.get(`/api/v1/perf/engine/split?since=${since}`);
    expect(r0.status).toBe(200);
    expect(r0.body.counts.oltp >= 0).toBe(true);
    expect(r0.body.counts.olap >= 0).toBe(true);

    // Simulate a few events
    perfService.record('select 1', 2, 'oltp');
    perfService.record('select 2 group by x', 10, 'olap');
    perfService.record('select 3', 3, 'oltp');

    const r1 = await agent.get(`/api/v1/perf/engine/split?since=${since}`);
    expect(r1.status).toBe(200);
    expect(r1.body.total).toBeGreaterThanOrEqual(3);
    expect(r1.body.counts.oltp).toBeGreaterThanOrEqual(2);
    expect(r1.body.counts.olap).toBeGreaterThanOrEqual(1);
    expect(r1.body.pctOlap).toBeGreaterThanOrEqual(0);
    expect(r1.body.pctOlap).toBeLessThanOrEqual(1);
  });
});

