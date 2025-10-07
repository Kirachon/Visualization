import { Request, Response, NextFunction } from 'express';
import { perfService } from '../services/perfService.js';

export const getSlowQueries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const since = parseInt((req.query.since as string) || '3600000', 10); // default 1h
    const list = perfService.slowSince(since);
    res.json(list);
  } catch (err) {
    next(err);
  }
};

export const getCacheStats = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await perfService.cacheStats();
    res.json(stats);
  } catch (err) {
    next(err);
  }
};

export const getEngineSplit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const since = parseInt((req.query.since as string) || '3600000', 10); // default 1h
    const split = perfService.engineSplitSince(since);
    res.json(split);
  } catch (err) {
    next(err);
  }
};


