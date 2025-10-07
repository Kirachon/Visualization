import { Request, Response, NextFunction } from 'express';
import { PipelineController } from '../pipelineController.js';

describe('PipelineController.validate', () => {
  const OLD_ENV = process.env;
  let controller: PipelineController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, PIPELINES_VALIDATE_API: 'true' };
    controller = new PipelineController();
    req = { body: { nodes: [{ id: 'n1', type: 'Extract' }, { id: 'n2', type: 'Load' }], edges: [{ from: 'n1', to: 'n2' }] } } as any;
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() } as any;
  });

  afterAll(() => { process.env = OLD_ENV; });

  it('returns validation result json when enabled', async () => {
    await controller.validate(req as Request, res as Response, ((): any => {}) as NextFunction);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ valid: true }));
  });

  it('returns 404 when feature disabled', async () => {
    process.env.PIPELINES_VALIDATE_API = 'false';
    await controller.validate(req as Request, res as Response, ((): any => {}) as NextFunction);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('PipelineController.plan', () => {
  const OLD_ENV = process.env;
  let controller: PipelineController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, PIPELINES_PLAN_API: 'true' };
    controller = new PipelineController();
    req = {
      body: {
        nodes: [
          { id: 'e1', type: 'Extract' },
          { id: 't1', type: 'Transform' },
          { id: 'l1', type: 'Load' },
        ],
        edges: [
          { from: 'e1', to: 't1' },
          { from: 't1', to: 'l1' },
        ],
      },
    } as any;
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() } as any;
  });

  afterAll(() => { process.env = OLD_ENV; });

  it('returns execution plan with stages when enabled', async () => {
    await controller.plan(req as Request, res as Response, ((): any => {}) as NextFunction);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        valid: true,
        plan: expect.objectContaining({
          stages: expect.any(Array),
          estimatedDurationMs: expect.any(Number),
        }),
      })
    );

    const callArgs = (res.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.plan.stages).toHaveLength(3);
    expect(callArgs.plan.stages[0]).toEqual(['e1']);
    expect(callArgs.plan.stages[1]).toEqual(['t1']);
    expect(callArgs.plan.stages[2]).toEqual(['l1']);
  });

  it('returns validation errors for invalid DAG', async () => {
    req.body = {
      nodes: [
        { id: 'a', type: 'Extract' },
        { id: 'b', type: 'Load' },
      ],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'a' }, // Cycle
      ],
    };

    await controller.plan(req as Request, res as Response, ((): any => {}) as NextFunction);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        valid: false,
        errors: expect.arrayContaining([expect.stringMatching(/cycle/i)]),
      })
    );
  });

  it('identifies parallel execution opportunities', async () => {
    req.body = {
      nodes: [
        { id: 'e1', type: 'Extract' },
        { id: 't1', type: 'Transform' },
        { id: 't2', type: 'Transform' },
        { id: 'l1', type: 'Load' },
      ],
      edges: [
        { from: 'e1', to: 't1' },
        { from: 'e1', to: 't2' },
        { from: 't1', to: 'l1' },
        { from: 't2', to: 'l1' },
      ],
    };

    await controller.plan(req as Request, res as Response, ((): any => {}) as NextFunction);

    const callArgs = (res.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.valid).toBe(true);
    expect(callArgs.plan.stages).toHaveLength(3);
    // Stage 1 should have both transforms running in parallel
    expect(callArgs.plan.stages[1]).toHaveLength(2);
    expect(callArgs.plan.stages[1]).toContain('t1');
    expect(callArgs.plan.stages[1]).toContain('t2');
  });

  it('returns 404 when feature disabled', async () => {
    process.env.PIPELINES_PLAN_API = 'false';
    await controller.plan(req as Request, res as Response, ((): any => {}) as NextFunction);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('PipelineController.listTransforms', () => {
  const OLD_ENV = process.env;
  let controller: PipelineController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, PIPELINES_TRANSFORMS_API: 'true' };
    controller = new PipelineController();
    req = {} as any;
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() } as any;
  });

  afterAll(() => { process.env = OLD_ENV; });

  it('returns list of transforms when enabled', async () => {
    await controller.listTransforms(req as Request, res as Response, ((): any => {}) as NextFunction);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        transforms: expect.any(Array),
      })
    );

    const callArgs = (res.json as jest.Mock).mock.calls[0][0];
    expect(callArgs.transforms.length).toBeGreaterThan(0);

    // Check structure of first transform
    const firstTransform = callArgs.transforms[0];
    expect(firstTransform).toHaveProperty('name');
    expect(firstTransform).toHaveProperty('description');
    expect(firstTransform).toHaveProperty('configSchema');
    expect(typeof firstTransform.name).toBe('string');
    expect(typeof firstTransform.description).toBe('string');
    expect(typeof firstTransform.configSchema).toBe('object');
  });

  it('includes expected transforms in response', async () => {
    await controller.listTransforms(req as Request, res as Response, ((): any => {}) as NextFunction);

    const callArgs = (res.json as jest.Mock).mock.calls[0][0];
    const names = callArgs.transforms.map((t: any) => t.name);

    expect(names).toContain('filter');
    expect(names).toContain('map');
    expect(names).toContain('aggregate');
    expect(names).toContain('join');
    expect(names).toContain('dedupe');
  });

  it('returns 404 when feature disabled', async () => {
    process.env.PIPELINES_TRANSFORMS_API = 'false';
    await controller.listTransforms(req as Request, res as Response, ((): any => {}) as NextFunction);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

