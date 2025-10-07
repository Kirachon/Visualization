import { Request, Response, NextFunction } from 'express';
import { AlertController } from '../alertController.js';
import { alertService } from '../../services/alertService.js';

describe('AlertController', () => {
  const OLD_ENV = process.env;
  let controller: AlertController;
  let req: Partial<Request>;
  let res: Partial<Response>;
  const tenantId = 'tenant_123';

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, ALERTS_API_ENABLE: 'true' };
    controller = new AlertController();
    (alertService as any).alerts.clear();
    (alertService as any).events.clear();
    (alertService as any).idCounter = 1;
    (alertService as any).eventIdCounter = 1;
    req = { body: {}, params: {}, query: {}, user: { tenantId } } as any;
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis(), send: jest.fn().mockReturnThis() } as any;
  });

  afterAll(() => { process.env = OLD_ENV; });

  describe('list', () => {
    it('returns 404 when feature disabled', async () => {
      process.env.ALERTS_API_ENABLE = 'false';
      await controller.list(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns alerts when enabled', async () => {
      await controller.list(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ alerts: expect.any(Array) }));
    });
  });

  describe('create', () => {
    it('creates alert with valid input', async () => {
      req.body = {
        name: 'Test Alert',
        subjectRef: 'dashboard:123',
        condition: { operator: '>', threshold: 80 },
        channels: ['email'],
      };
      await controller.create(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(String) }));
    });

    it('returns 400 for invalid condition', async () => {
      req.body = {
        name: 'Test',
        subjectRef: 'dashboard:123',
        condition: { operator: 'bad' },
        channels: ['email'],
      };
      await controller.create(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('get', () => {
    it('returns alert by id', async () => {
      const created = alertService.create({
        tenantId,
        name: 'Test',
        subjectRef: 'd:1',
        condition: { operator: '>', threshold: 10 },
        channels: ['email'],
      });
      req.params = { id: created.id };
      await controller.get(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: created.id }));
    });

    it('returns 404 for non-existent id', async () => {
      req.params = { id: 'nonexistent' };
      await controller.get(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('update', () => {
    it('updates alert', async () => {
      const created = alertService.create({
        tenantId,
        name: 'Test',
        subjectRef: 'd:1',
        condition: { operator: '>', threshold: 10 },
        channels: ['email'],
      });
      req.params = { id: created.id };
      req.body = { name: 'Updated' };
      await controller.update(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated' }));
    });

    it('returns 404 for non-existent id', async () => {
      req.params = { id: 'nonexistent' };
      req.body = { enabled: false };
      await controller.update(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('delete', () => {
    it('deletes alert', async () => {
      const created = alertService.create({
        tenantId,
        name: 'Test',
        subjectRef: 'd:1',
        condition: { operator: '>', threshold: 10 },
        channels: ['email'],
      });
      req.params = { id: created.id };
      await controller.delete(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(204);
    });

    it('returns 404 for non-existent id', async () => {
      req.params = { id: 'nonexistent' };
      await controller.delete(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('test', () => {
    it('sends test alert', async () => {
      const created = alertService.create({
        tenantId,
        name: 'Test',
        subjectRef: 'd:1',
        condition: { operator: '>', threshold: 10 },
        channels: ['email', 'slack'],
      });
      req.params = { id: created.id };
      await controller.test(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, deliveries: expect.any(Array) }));
    });
  });

  describe('history', () => {
    it('returns alert history', async () => {
      const created = alertService.create({
        tenantId,
        name: 'Test',
        subjectRef: 'd:1',
        condition: { operator: '>', threshold: 10 },
        channels: ['email'],
      });
      alertService.test(created.id, tenantId);
      req.params = { id: created.id };
      await controller.history(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ events: expect.any(Array) }));
    });
  });
});

