import { pipelineService } from '../pipelineService.js';

describe('pipelineService.validateDAG', () => {
  it('validates a simple linear DAG and returns topo order', () => {
    const dag = {
      nodes: [
        { id: 'n1', type: 'Extract' },
        { id: 'n2', type: 'Transform' },
        { id: 'n3', type: 'Load' },
      ],
      edges: [
        { from: 'n1', to: 'n2' },
        { from: 'n2', to: 'n3' },
      ],
    } as any;

    const res = pipelineService.validateDAG(dag);
    expect(res.valid).toBe(true);
    expect(res.errors).toEqual([]);
    expect(res.topoOrder).toHaveLength(3);
  });

  it('detects cycle in DAG', () => {
    const dag = {
      nodes: [
        { id: 'a', type: 'Extract' },
        { id: 'b', type: 'Load' },
      ],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'a' },
      ],
    } as any;

    const res = pipelineService.validateDAG(dag);
    expect(res.valid).toBe(false);
    expect(res.errors.join(' ')).toMatch(/cycle/i);
  });

  it('fails for missing Extract or Load', () => {
    const dag = {
      nodes: [ { id: 'x', type: 'Transform' } ],
      edges: [],
    } as any;
    const res = pipelineService.validateDAG(dag);
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => /Extract/.test(e))).toBe(true);
    expect(res.errors.some(e => /Load/.test(e))).toBe(true);
  });

  it('strict config validation: OFF allows missing configs; ON rejects', () => {
    const dag: any = {
      nodes: [ { id: 'e1', type: 'Extract' }, { id: 'l1', type: 'Load' } ],
      edges: [ { from: 'e1', to: 'l1' } ],
    };
    // OFF
    process.env.PIPELINES_STRICT_VALIDATION = 'false';
    let res = pipelineService.validateDAG(dag);
    expect(res.valid).toBe(true);
    // ON
    process.env.PIPELINES_STRICT_VALIDATION = 'true';
    res = pipelineService.validateDAG(dag);
    expect(res.valid).toBe(false);
    expect(res.errors.join(' ')).toMatch(/requires/);
  });
});

describe('pipelineService.planExecution', () => {
  it('returns execution plan with stages for a linear DAG', () => {
    // Temporarily disable strict validation for this test
    const oldStrict = process.env.PIPELINES_STRICT_VALIDATION;
    process.env.PIPELINES_STRICT_VALIDATION = 'false';

    const dag = {
      nodes: [
        { id: 'extract1', type: 'Extract' },
        { id: 'transform1', type: 'Transform' },
        { id: 'load1', type: 'Load' },
      ],
      edges: [
        { from: 'extract1', to: 'transform1' },
        { from: 'transform1', to: 'load1' },
      ],
    } as any;

    const result = pipelineService.planExecution(dag);

    // Restore env
    if (oldStrict !== undefined) process.env.PIPELINES_STRICT_VALIDATION = oldStrict;
    else delete process.env.PIPELINES_STRICT_VALIDATION;

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.plan).toBeDefined();
    expect(result.plan?.stages).toHaveLength(3);
    expect(result.plan?.stages[0]).toEqual(['extract1']);
    expect(result.plan?.stages[1]).toEqual(['transform1']);
    expect(result.plan?.stages[2]).toEqual(['load1']);
    expect(result.plan?.estimatedDurationMs).toBe(300); // 3 stages * 100ms
  });

  it('identifies parallel execution opportunities in a diamond DAG', () => {
    const oldStrict = process.env.PIPELINES_STRICT_VALIDATION;
    process.env.PIPELINES_STRICT_VALIDATION = 'false';

    const dag = {
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
    } as any;

    const result = pipelineService.planExecution(dag);

    if (oldStrict !== undefined) process.env.PIPELINES_STRICT_VALIDATION = oldStrict;
    else delete process.env.PIPELINES_STRICT_VALIDATION;

    expect(result.valid).toBe(true);
    expect(result.plan?.stages).toHaveLength(3);
    expect(result.plan?.stages[0]).toEqual(['e1']);
    // Stage 1 should contain both transforms (parallel execution)
    expect(result.plan?.stages[1]).toHaveLength(2);
    expect(result.plan?.stages[1]).toContain('t1');
    expect(result.plan?.stages[1]).toContain('t2');
    expect(result.plan?.stages[2]).toEqual(['l1']);
  });

  it('handles complex DAG with multiple parallel paths', () => {
    const oldStrict = process.env.PIPELINES_STRICT_VALIDATION;
    process.env.PIPELINES_STRICT_VALIDATION = 'false';

    const dag = {
      nodes: [
        { id: 'e1', type: 'Extract' },
        { id: 'e2', type: 'Extract' },
        { id: 't1', type: 'Transform' },
        { id: 't2', type: 'Transform' },
        { id: 'v1', type: 'Validate' },
        { id: 'l1', type: 'Load' },
      ],
      edges: [
        { from: 'e1', to: 't1' },
        { from: 'e2', to: 't2' },
        { from: 't1', to: 'v1' },
        { from: 't2', to: 'v1' },
        { from: 'v1', to: 'l1' },
      ],
    } as any;

    const result = pipelineService.planExecution(dag);

    if (oldStrict !== undefined) process.env.PIPELINES_STRICT_VALIDATION = oldStrict;
    else delete process.env.PIPELINES_STRICT_VALIDATION;

    expect(result.valid).toBe(true);
    expect(result.plan?.stages).toHaveLength(4);
    // Stage 0: both extracts can run in parallel
    expect(result.plan?.stages[0]).toHaveLength(2);
    expect(result.plan?.stages[0]).toContain('e1');
    expect(result.plan?.stages[0]).toContain('e2');
    // Stage 1: both transforms can run in parallel
    expect(result.plan?.stages[1]).toHaveLength(2);
    expect(result.plan?.stages[1]).toContain('t1');
    expect(result.plan?.stages[1]).toContain('t2');
    // Stage 2: validate
    expect(result.plan?.stages[2]).toEqual(['v1']);
    // Stage 3: load
    expect(result.plan?.stages[3]).toEqual(['l1']);
  });

  it('returns validation errors for invalid DAG', () => {
    const dag = {
      nodes: [
        { id: 'a', type: 'Extract' },
        { id: 'b', type: 'Load' },
      ],
      edges: [
        { from: 'a', to: 'b' },
        { from: 'b', to: 'a' }, // Cycle
      ],
    } as any;

    const result = pipelineService.planExecution(dag);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.join(' ')).toMatch(/cycle/i);
    expect(result.plan).toBeUndefined();
  });

  it('returns errors for DAG missing required node types', () => {
    const dag = {
      nodes: [
        { id: 't1', type: 'Transform' },
      ],
      edges: [],
    } as any;

    const result = pipelineService.planExecution(dag);

    expect(result.valid).toBe(false);
    expect(result.errors.some(e => /Extract/.test(e))).toBe(true);
    expect(result.errors.some(e => /Load/.test(e))).toBe(true);
    expect(result.plan).toBeUndefined();
  });
});





describe('pipelineService.validateDAG - transform registry integration', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    process.env = { ...OLD_ENV };
  });

  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('validates transform config when strict validation is ON', () => {
    process.env.PIPELINES_STRICT_VALIDATION = 'true';

    const dag: any = {
      nodes: [
        { id: 'e1', type: 'Extract', config: { source: 'db.users' } },
        { id: 't1', type: 'Transform', config: { op: 'filter', condition: 'age > 18' } },
        { id: 'l1', type: 'Load', config: { target: 'warehouse.adults' } },
      ],
      edges: [
        { from: 'e1', to: 't1' },
        { from: 't1', to: 'l1' },
      ],
    };

    const result = pipelineService.validateDAG(dag);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects invalid transform config when strict validation is ON', () => {
    process.env.PIPELINES_STRICT_VALIDATION = 'true';

    const dag: any = {
      nodes: [
        { id: 'e1', type: 'Extract', config: { source: 'db.users' } },
        { id: 't1', type: 'Transform', config: { op: 'filter' } }, // Missing condition
        { id: 'l1', type: 'Load', config: { target: 'warehouse.adults' } },
      ],
      edges: [
        { from: 'e1', to: 't1' },
        { from: 't1', to: 'l1' },
      ],
    };

    const result = pipelineService.validateDAG(dag);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('t1') && e.includes('condition'))).toBe(true);
  });

  it('rejects unknown transform when strict validation is ON', () => {
    process.env.PIPELINES_STRICT_VALIDATION = 'true';

    const dag: any = {
      nodes: [
        { id: 'e1', type: 'Extract', config: { source: 'db.users' } },
        { id: 't1', type: 'Transform', config: { op: 'nonexistent', foo: 'bar' } },
        { id: 'l1', type: 'Load', config: { target: 'warehouse.adults' } },
      ],
      edges: [
        { from: 'e1', to: 't1' },
        { from: 't1', to: 'l1' },
      ],
    };

    const result = pipelineService.validateDAG(dag);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('t1') && e.toLowerCase().includes('unknown'))).toBe(true);
  });

  it('validates complex transform configs (aggregate)', () => {
    process.env.PIPELINES_STRICT_VALIDATION = 'true';

    const dag: any = {
      nodes: [
        { id: 'e1', type: 'Extract', config: { source: 'db.sales' } },
        {
          id: 't1',
          type: 'Transform',
          config: {
            op: 'aggregate',
            groupBy: ['category'],
            aggregations: { totalSales: 'SUM(amount)' },
          },
        },
        { id: 'l1', type: 'Load', config: { target: 'warehouse.sales_summary' } },
      ],
      edges: [
        { from: 'e1', to: 't1' },
        { from: 't1', to: 'l1' },
      ],
    };

    const result = pipelineService.validateDAG(dag);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('does not validate transform config when strict validation is OFF', () => {
    process.env.PIPELINES_STRICT_VALIDATION = 'false';

    const dag: any = {
      nodes: [
        { id: 'e1', type: 'Extract' },
        { id: 't1', type: 'Transform', config: { op: 'filter' } }, // Missing condition, but should pass
        { id: 'l1', type: 'Load' },
      ],
      edges: [
        { from: 'e1', to: 't1' },
        { from: 't1', to: 'l1' },
      ],
    };

    const result = pipelineService.validateDAG(dag);
    expect(result.valid).toBe(true); // Passes because strict validation is OFF
  });
});
