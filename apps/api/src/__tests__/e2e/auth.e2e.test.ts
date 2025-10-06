import request from 'supertest';
import { app, server } from '../../server.js';

describe('Authentication E2E Tests', () => {
  afterAll((done) => {
    server.close(done);
  });

  describe('Complete Authentication Flow', () => {
    let authToken: string;
    let refreshToken: string;

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'admin',
          password: 'admin123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body.user.username).toBe('admin');

      authToken = response.body.token;
      refreshToken = response.body.refreshToken;
    });

    it('should reject login with invalid credentials', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'admin',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should reject login with invalid username format', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'ab', // too short
          password: 'password123',
        })
        .expect(400);
    });

    it('should reject login with invalid password format', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          password: 'short', // too short
        })
        .expect(400);
    });

    it('should reject login with missing fields', async () => {
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'testuser',
          // password missing
        })
        .expect(400);
    });

    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('admin');
    });

    it('should reject protected route without token', async () => {
      await request(app).get('/api/v1/auth/me').expect(401);
    });

    it('should refresh access token', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({
          refreshToken,
        })
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.token).toBeTruthy();
    });

    it('should logout successfully', async () => {
      await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Role-Based Access Control', () => {
    let viewerToken: string;

    it('should login as viewer', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          username: 'viewer',
          password: 'viewer123',
        })
        .expect(200);

      expect(response.body.user.role.name).toBe('Viewer');
      viewerToken = response.body.token;
    });

    it('should access viewer profile', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${viewerToken}`)
        .expect(200);

      expect(response.body.user.role.name).toBe('Viewer');
    });
  });
});

