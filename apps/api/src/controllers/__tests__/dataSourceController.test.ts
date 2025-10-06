import request from 'supertest';
import express from 'express';
import dataSourceRoutes from '../../routes/dataSourceRoutes.js';
import { dataSourceService } from '../../services/dataSourceService.js';

jest.mock('../../services/dataSourceService.js');
const mockService = dataSourceService as jest.Mocked<typeof dataSourceService>;

const app = express();
app.use(express.json());
app.use('/api/v1', dataSourceRoutes);

describe('DataSourceController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /data-sources', () => {
    it('creates a data source', async () => {
      mockService.create.mockResolvedValue({
        id: 'ds-1',
        name: 'Test',
        type: 'postgresql',
        connectionConfig: { host: 'localhost', port: 5432, database: 'db', username: 'user', password: 'pass' },
        tenantId: 't1',
        ownerId: 'u1',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      const res = await request(app)
        .post('/api/v1/data-sources')
        .send({
          name: 'Test',
          type: 'postgresql',
          connectionConfig: { host: 'localhost', port: 5432, database: 'db', username: 'user', password: 'pass', ssl: false },
          tenantId: 't1',
          ownerId: 'u1',
        })
        .expect(201);

      expect(res.body.id).toBe('ds-1');
    });
  });

  describe('GET /data-sources', () => {
    it('lists data sources', async () => {
      mockService.list.mockResolvedValue([
        { id: 'ds-1', name: 'DS1', type: 'postgresql', connectionConfig: {} as any, tenantId: 't1', ownerId: 'u1', status: 'active', createdAt: new Date(), updatedAt: new Date() },
      ]);

      const res = await request(app)
        .get('/api/v1/data-sources')
        .query({ tenantId: 't1' })
        .expect(200);

      expect(res.body).toHaveLength(1);
    });
  });

  describe('POST /data-sources/test', () => {
    it('tests connection', async () => {
      mockService.testConnection.mockResolvedValue({ ok: true });

      const res = await request(app)
        .post('/api/v1/data-sources/test')
        .send({ connectionConfig: { host: 'localhost', port: 5432, database: 'db', username: 'user', password: 'pass' } })
        .expect(200);

      expect(res.body.ok).toBe(true);
    });
  });
});

