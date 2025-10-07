import { Request, Response, NextFunction } from 'express';
import { ScheduleController } from '../scheduleController.js';
import { scheduleService } from '../../services/scheduleService.js';

describe('ScheduleController', () => {
  const OLD_ENV = process.env;
  let controller: ScheduleController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, SCHEDULES_API_ENABLE: 'true' };
    controller = new ScheduleController();
    // Clear schedules from singleton between tests
    (scheduleService as any).schedules.clear();
    (scheduleService as any).idCounter = 1;
    req = { body: {}, params: {} } as any;
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis(), send: jest.fn().mockReturnThis() } as any;
  });

  afterAll(() => { process.env = OLD_ENV; });

  describe('list', () => {
    it('returns 404 when feature disabled', async () => {
      process.env.SCHEDULES_API_ENABLE = 'false';
      await controller.list(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns schedules when enabled', async () => {
      await controller.list(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ schedules: expect.any(Array) }));
    });
  });

  describe('create', () => {
    it('creates schedule with valid input', async () => {
      req.body = { subjectType: 'dashboard', subjectId: 'd1', cronExpression: '0 0 * * *' };
      await controller.create(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(String) }));
    });

    it('returns 400 for invalid cron', async () => {
      req.body = { subjectType: 'dashboard', subjectId: 'd1', cronExpression: 'bad' };
      await controller.create(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('get', () => {
    it('returns schedule by id', async () => {
      const created = scheduleService.create({ subjectType: 'dashboard', subjectId: 'd1', cronExpression: '0 0 * * *' });
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
    it('updates schedule', async () => {
      const created = scheduleService.create({ subjectType: 'dashboard', subjectId: 'd1', cronExpression: '0 0 * * *' });
      req.params = { id: created.id };
      req.body = { cronExpression: '0 12 * * *' };
      await controller.update(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ cronExpression: '0 12 * * *' }));
    });

    it('returns 404 for non-existent id', async () => {
      req.params = { id: 'nonexistent' };
      req.body = { enabled: false };
      await controller.update(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('delete', () => {
    it('deletes schedule', async () => {
      const created = scheduleService.create({ subjectType: 'dashboard', subjectId: 'd1', cronExpression: '0 0 * * *' });
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

  describe('pause', () => {
    it('pauses schedule', async () => {
      const created = scheduleService.create({ subjectType: 'dashboard', subjectId: 'd1', cronExpression: '0 0 * * *' });
      req.params = { id: created.id };
      await controller.pause(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }));
    });
  });

  describe('resume', () => {
    it('resumes schedule', async () => {
      const created = scheduleService.create({ subjectType: 'dashboard', subjectId: 'd1', cronExpression: '0 0 * * *', enabled: false });
      req.params = { id: created.id };
      await controller.resume(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
    });
  });

  describe('runNow', () => {
    it('triggers immediate execution', async () => {
      const created = scheduleService.create({ subjectType: 'dashboard', subjectId: 'd1', cronExpression: '0 0 * * *' });
      req.params = { id: created.id };
      await controller.runNow(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(String), status: 'pending' }));
    });

    it('returns 404 for non-existent schedule', async () => {
      req.params = { id: 'nonexistent' };
      await controller.runNow(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});

