import { Request, Response, NextFunction } from 'express';
import { StreamingController } from '../streamingController.js';

describe('StreamingController', () => {
  const OLD_ENV = process.env;
  let controller: StreamingController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    controller = new StreamingController();
    req = {} as any;
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() } as any;
  });

  afterAll(() => { process.env = OLD_ENV; });

  describe('pipelines', () => {
    it('returns 404 when feature disabled', async () => {
      process.env.STREAMING_API_ENABLE = 'false';
      await controller.pipelines(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns pipelines when enabled', async () => {
      process.env.STREAMING_API_ENABLE = 'true';
      await controller.pipelines(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ pipelines: expect.any(Array) }));
    });
  });

  describe('metrics', () => {
    it('returns 404 when feature disabled', async () => {
      process.env.STREAMING_API_ENABLE = 'false';
      await controller.metrics(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns metrics when enabled', async () => {
      process.env.STREAMING_API_ENABLE = 'true';
      await controller.metrics(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ts: expect.any(String), pipelines: expect.any(Array) }));
    });
  });

  describe('replay', () => {
    beforeEach(() => {
      (res.status as jest.Mock).mockClear();
      (res.json as jest.Mock).mockClear();
    });

    it('returns 404 when replay feature disabled', async () => {
      process.env.STREAMING_REPLAY_ENABLE = 'false';
      req.body = { topic: 'cdc.orders', fromOffset: 0 } as any;
      await controller.replay(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('accepts valid replay request (fromOffset) when enabled', async () => {
      process.env.STREAMING_REPLAY_ENABLE = 'true';
      req.body = { topic: 'cdc.orders', fromOffset: 100, toOffset: 200 } as any;
      await controller.replay(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ replayId: expect.any(String), accepted: true }));
    });

    it('rejects invalid replay request with 400', async () => {
      process.env.STREAMING_REPLAY_ENABLE = 'true';
      req.body = { topic: 'INVALID TOPIC', fromOffset: 0 } as any;
      await controller.replay(req as Request, res as Response, ((): any => {}) as NextFunction);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Bad Request' }));
    });
  });
});

