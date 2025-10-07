import { validateTransformConfig } from './transformRegistry.js';

export type PipelineNodeType = 'Extract' | 'Transform' | 'Load' | 'Validate';

export interface PipelineNode {
  id: string;
  type: PipelineNodeType;
  config?: any; // free-form; validated in later slices
}

export interface PipelineEdge { from: string; to: string }

export interface PipelineDag { nodes: PipelineNode[]; edges: PipelineEdge[] }

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  topoOrder?: string[];
}

export interface ExecutionPlan {
  valid: boolean;
  errors: string[];
  plan?: {
    stages: string[][]; // Each stage contains node IDs that can run in parallel
    estimatedDurationMs?: number; // Optional: sum of longest path
  };
}

class PipelineService {
  private allowed: Set<PipelineNodeType> = new Set(['Extract', 'Transform', 'Load', 'Validate']);

  validateDAG(dag: PipelineDag): ValidationResult {
    const errors: string[] = [];
    if (!dag || !Array.isArray(dag.nodes) || !Array.isArray(dag.edges)) {
      return { valid: false, errors: ['Invalid payload: nodes and edges are required arrays'] };
    }
    if (dag.nodes.length === 0) return { valid: false, errors: ['Pipeline must contain at least one node'] };

    // Node checks
    const idSet = new Set<string>();
    for (const n of dag.nodes) {
      if (!n?.id || typeof n.id !== 'string') errors.push('Node id is required');
      if (idSet.has(n.id)) errors.push(`Duplicate node id: ${n.id}`);
      idSet.add(n.id);
      if (!this.allowed.has(n.type)) errors.push(`Invalid node type for ${n.id}: ${n.type}`);
    }

    // Edge checks
    const nodeIds = new Set(dag.nodes.map(n => n.id));
    for (const e of dag.edges) {
      if (!nodeIds.has(e.from)) errors.push(`Edge from references missing node: ${e.from}`);
      if (!nodeIds.has(e.to)) errors.push(`Edge to references missing node: ${e.to}`);
    }

    // Degree maps for simple connectivity/orphan checks
    const inDeg = new Map<string, number>();
    const outDeg = new Map<string, number>();
    dag.nodes.forEach(n => { inDeg.set(n.id, 0); outDeg.set(n.id, 0); });
    dag.edges.forEach(e => { outDeg.set(e.from, (outDeg.get(e.from) || 0) + 1); inDeg.set(e.to, (inDeg.get(e.to) || 0) + 1); });

    // At least one Extract and one Load
    if (!dag.nodes.some(n => n.type === 'Extract')) errors.push('Pipeline must contain at least one Extract node');
    if (!dag.nodes.some(n => n.type === 'Load')) errors.push('Pipeline must contain at least one Load node');

    // Orphan nodes (no in and no out)
    for (const n of dag.nodes) {
      if ((inDeg.get(n.id) || 0) === 0 && (outDeg.get(n.id) || 0) === 0) {
        errors.push(`Orphan node (no edges): ${n.id}`);
      }
    }

    // Cycle detection via Kahn's algorithm
    const indeg = new Map(inDeg);
    const adj = new Map<string, string[]>();
    dag.nodes.forEach(n => adj.set(n.id, []));
    dag.edges.forEach(e => { (adj.get(e.from) as string[]).push(e.to); });
    const queue: string[] = [];
    for (const [id, d] of indeg.entries()) if (d === 0) queue.push(id);
    const order: string[] = [];
    while (queue.length) {
      const u = queue.shift()!;
      order.push(u);
      for (const v of adj.get(u) || []) {
        indeg.set(v, (indeg.get(v) || 0) - 1);
        if ((indeg.get(v) || 0) === 0) queue.push(v);
      }
    }
    if (order.length !== dag.nodes.length) errors.push('Cycle detected in pipeline DAG');

    // Strict per-node config validation (feature-flagged)
    const strict = (process.env.PIPELINES_STRICT_VALIDATION || 'false').toLowerCase() === 'true';
    if (strict) {
      for (const n of dag.nodes) {
        const cfg = n.config || {};
        switch (n.type) {
          case 'Extract':
            if (!cfg.source || typeof cfg.source !== 'string') errors.push(`Extract ${n.id} requires string config.source`);
            break;
          case 'Load':
            if (!cfg.target || typeof cfg.target !== 'string') errors.push(`Load ${n.id} requires string config.target`);
            break;
          case 'Transform':
            if (!cfg.op || typeof cfg.op !== 'string') {
              errors.push(`Transform ${n.id} requires string config.op`);
            } else {
              // Validate transform config against registry
              const transformErrors = validateTransformConfig(cfg.op, cfg);
              transformErrors.forEach(err => errors.push(`Transform ${n.id}: ${err}`));
            }
            break;
          case 'Validate':
            if (!cfg.rule && !Array.isArray(cfg.rules)) errors.push(`Validate ${n.id} requires config.rule or config.rules[]`);
            break;
        }
      }
    }

    return { valid: errors.length === 0, errors, topoOrder: errors.length === 0 ? order : undefined };
  }

  /**
   * planExecution computes execution stages for a pipeline DAG.
   * Each stage contains nodes that can run in parallel (no dependencies between them).
   * Returns an ExecutionPlan with stages array or validation errors.
   */
  planExecution(dag: PipelineDag): ExecutionPlan {
    // First validate the DAG structure
    const validation = this.validateDAG(dag);
    if (!validation.valid) {
      return { valid: false, errors: validation.errors };
    }

    // Build adjacency list and in-degree map for level-based grouping
    const inDeg = new Map<string, number>();
    const adj = new Map<string, string[]>();
    dag.nodes.forEach(n => {
      inDeg.set(n.id, 0);
      adj.set(n.id, []);
    });
    dag.edges.forEach(e => {
      inDeg.set(e.to, (inDeg.get(e.to) || 0) + 1);
      (adj.get(e.from) as string[]).push(e.to);
    });

    // Compute stages using modified Kahn's algorithm (level-order BFS)
    const stages: string[][] = [];
    const indeg = new Map(inDeg);
    let currentLevel: string[] = [];

    // Initialize with all nodes that have in-degree 0
    for (const [id, d] of indeg.entries()) {
      if (d === 0) currentLevel.push(id);
    }

    while (currentLevel.length > 0) {
      stages.push([...currentLevel]); // Add current level as a stage
      const nextLevel: string[] = [];

      for (const u of currentLevel) {
        for (const v of adj.get(u) || []) {
          indeg.set(v, (indeg.get(v) || 0) - 1);
          if ((indeg.get(v) || 0) === 0) {
            nextLevel.push(v);
          }
        }
      }

      currentLevel = nextLevel;
    }

    // Sanity check: all nodes should be in stages (already validated for cycles)
    const totalNodes = stages.reduce((sum, stage) => sum + stage.length, 0);
    if (totalNodes !== dag.nodes.length) {
      return { valid: false, errors: ['Internal error: stage computation mismatch'] };
    }

    // Optional: estimate duration (placeholder logic; can be enhanced with node metadata)
    // For now, assume each node takes 100ms; longest path = number of stages * 100ms
    const estimatedDurationMs = stages.length * 100;

    return {
      valid: true,
      errors: [],
      plan: {
        stages,
        estimatedDurationMs,
      },
    };
  }
}

export const pipelineService = new PipelineService();

