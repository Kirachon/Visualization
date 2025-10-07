import request from 'supertest';
import { app } from '../../server';

describe('Optimizer analyze endpoint', () => {
  test('POST /api/v1/optimize/analyze returns plan and recommendations', async () => {
    const res = await request(app)
      .post('/api/v1/optimize/analyze')
      .send({ sql: 'SELECT * FROM big_table' });
    expect(res.status).toBe(200);
    expect(res.body.plan).toBeTruthy();
    expect(res.body.recommendations).toBeInstanceOf(Array);
    expect(typeof res.body.totalCost).toBe('number');
  });

  test('returns 400 when sql missing', async () => {
    const res = await request(app)
      .post('/api/v1/optimize/analyze')
      .send({});
    expect(res.status).toBe(400);
  });

  test('rewrite field present when flag enabled (simulated true)', async () => {
    const old = process.env.OPTIMIZER_REWRITE_ENABLE;
    process.env.OPTIMIZER_REWRITE_ENABLE = 'true';
    const res = await request(app)
      .post('/api/v1/optimize/analyze')
      .send({ sql: 'SELECT * FROM t' });
    expect(res.status).toBe(200);
    expect(typeof res.body.rewrittenSql).toBe('string');
    process.env.OPTIMIZER_REWRITE_ENABLE = old;
  });
});

