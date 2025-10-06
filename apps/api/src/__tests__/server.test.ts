import request from 'supertest';
import { app, server } from '../server.js';

describe('Server', () => {
  afterAll((done) => {
    server.close(done);
  });

  describe('GET /api/v1/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/v1/health').expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api/v1', () => {
    it('should return API information', async () => {
      const response = await request(app).get('/api/v1').expect(200);

      expect(response.body).toHaveProperty('message', 'BI Platform API v1');
      expect(response.body).toHaveProperty('version', '1.0.0');
    });
  });

  describe('GET /api/v1/nonexistent', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/v1/nonexistent').expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'NOT_FOUND');
    });
  });
});

