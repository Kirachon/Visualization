/**
 * Filter Controller
 * Story 2.3: Advanced Filtering & Cross-Filtering
 */

import { Request, Response, NextFunction } from 'express';
import { filterEvaluationService } from '../services/filterEvaluationService.js';
import { filterSetService } from '../services/filterSetService.js';
import { logger } from '../logger/logger.js';

/**
 * Evaluate a filter configuration
 */
export async function evaluateFilter(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const result = await filterEvaluationService.evaluate(req.body, tenantId);
    
    if (!result.success) {
      res.status(400).json({ error: result.error });
      return;
    }
    
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Filter evaluation failed', { error: error.message });
    next(error);
  }
}

/**
 * Create a new filter set
 */
export async function createFilterSet(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = (req as any).user?.tenantId;
    const userId = (req as any).user?.id;
    
    if (!tenantId || !userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const filterSet = await filterSetService.create(req.body, tenantId, userId);
    res.status(201).json(filterSet);
  } catch (error: any) {
    logger.error('Failed to create filter set', { error: error.message });
    next(error);
  }
}

/**
 * Get a filter set by ID
 */
export async function getFilterSet(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const filterSet = await filterSetService.getById(req.params.id, tenantId);
    
    if (!filterSet) {
      res.status(404).json({ error: 'Filter set not found' });
      return;
    }
    
    res.status(200).json(filterSet);
  } catch (error: any) {
    logger.error('Failed to get filter set', { error: error.message });
    next(error);
  }
}

/**
 * List filter sets
 */
export async function listFilterSets(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const params = {
      dashboardId: req.query.dashboardId as string,
      isGlobal: req.query.isGlobal === 'true',
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
    };
    
    const result = await filterSetService.list(params, tenantId);
    res.status(200).json(result);
  } catch (error: any) {
    logger.error('Failed to list filter sets', { error: error.message });
    next(error);
  }
}

/**
 * Update a filter set
 */
export async function updateFilterSet(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    const filterSet = await filterSetService.update(req.params.id, req.body, tenantId);
    res.status(200).json(filterSet);
  } catch (error: any) {
    logger.error('Failed to update filter set', { error: error.message });
    next(error);
  }
}

/**
 * Delete a filter set
 */
export async function deleteFilterSet(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantId = (req as any).user?.tenantId;
    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    
    await filterSetService.delete(req.params.id, tenantId);
    res.status(204).send();
  } catch (error: any) {
    logger.error('Failed to delete filter set', { error: error.message });
    next(error);
  }
}

