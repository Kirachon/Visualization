import { Request, Response, NextFunction } from 'express';
import { DQController } from '../dqController.js';
import { dqService } from '../../services/dqService.js';

describe('DQController', () => {
  const OLD_ENV = process.env;
  let controller: DQController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, DQ_API_ENABLE: 'true' };
    controller = new DQController();
    (dqService as any).rules.clear();
    (dqService as any).results.clear();
    (dqService as any).profiles.clear();
    (dqService as any).scores.clear();
    (dqService as any).ruleIdCounter = 1;
    (dqService as any).resultIdCounter = 1;
    (dqService as any).profileIdCounter = 1;
    (dqService as any).scoreIdCounter = 1;
    req = { body: {}, params: {}, query: {} } as any;
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis(), send: jest.fn().mockReturnThis() } as any;
  });

  afterAll(() => { process.env = OLD_ENV; });

  describe('listRules', () => {
    it('returns 404 when feature disabled', async () => {
      process.env.DQ_API_ENABLE = 'false';
      await controller.listRules(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns rules when enabled', async () => {
      await controller.listRules(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ rules: expect.any(Array) }));
    });
  });

  describe('createRule', () => {
    it('creates rule with valid input', async () => {
      req.body = { assetId: 'table:users', type: 'completeness', config: {} };
      await controller.createRule(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(String) }));
    });

    it('returns 400 for invalid type', async () => {
      req.body = { assetId: 'table:users', type: 'bad', config: {} };
      await controller.createRule(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getRule', () => {
    it('returns rule by id', async () => {
      const created = dqService.createRule({ assetId: 'table:users', type: 'completeness', config: {} });
      req.params = { id: created.id };
      await controller.getRule(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: created.id }));
    });

    it('returns 404 for non-existent id', async () => {
      req.params = { id: 'nonexistent' };
      await controller.getRule(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateRule', () => {
    it('updates rule', async () => {
      const created = dqService.createRule({ assetId: 'table:users', type: 'completeness', config: { threshold: 0.9 } });
      req.params = { id: created.id };
      req.body = { config: { threshold: 0.95 } };
      await controller.updateRule(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ config: { threshold: 0.95 } }));
    });
  });

  describe('deleteRule', () => {
    it('deletes rule', async () => {
      const created = dqService.createRule({ assetId: 'table:users', type: 'completeness', config: {} });
      req.params = { id: created.id };
      await controller.deleteRule(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(204);
    });
  });

  describe('listResults', () => {
    it('returns results', async () => {
      await controller.listResults(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ results: expect.any(Array) }));
    });
  });

  describe('listProfiles', () => {
    it('returns profiles', async () => {
      await controller.listProfiles(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ profiles: expect.any(Array) }));
    });
  });

  describe('listScores', () => {
    it('returns scores', async () => {
      await controller.listScores(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ scores: expect.any(Array) }));
    });
  });
});

