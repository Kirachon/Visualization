import { Request, Response, NextFunction } from 'express';
import { metadataService } from '../services/metadataService.js';
import { lineageService } from '../services/lineageService.js';
import { glossaryService } from '../services/glossaryService.js';
import { dataQualityService } from '../services/dataQualityService.js';
import { impactService } from '../services/impactService.js';
import { searchService } from '../services/searchService.js';

export class MetadataController {
  async createAsset(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, name, tags, attrs } = req.body;
      if (!type || !name) { res.status(400).json({ error: 'type and name required' }); return; }
      const ownerId = req.user?.userId;
      const asset = await metadataService.createAsset({ type, name, ownerId, tags, attrs });
      res.status(201).json(asset);
    } catch (err) { next(err); }
  }

  async listAssets(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, ownerId } = req.query;
      const assets = await metadataService.listAssets({ type: type as string, ownerId: ownerId as string });
      res.json(assets);
    } catch (err) { next(err); }
  }

  async getLineage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { assetId } = req.params;
      const lineage = await lineageService.getLineage(assetId);
      res.json(lineage);
    } catch (err) { next(err); }
  }

  async createGlossaryTerm(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { term, definition, synonyms, relatedTerms } = req.body;
      if (!term) { res.status(400).json({ error: 'term required' }); return; }
      const ownerId = req.user?.userId;
      const glossaryTerm = await glossaryService.create({ term, definition, synonyms, ownerId, relatedTerms });
      res.status(201).json(glossaryTerm);
    } catch (err) { next(err); }
  }

  async listGlossaryTerms(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const terms = await glossaryService.list();
      res.json(terms);
    } catch (err) { next(err); }
  }

  async getQualityMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { assetId } = req.query;
      if (!assetId) { res.status(400).json({ error: 'assetId required' }); return; }
      const metrics = await dataQualityService.getMetrics(assetId as string);
      res.json(metrics);
    } catch (err) { next(err); }
  }

  async analyzeImpact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { changeRef, impactedAssetIds, details } = req.body;
      if (!changeRef || !impactedAssetIds) { res.status(400).json({ error: 'changeRef and impactedAssetIds required' }); return; }
      const records = await impactService.analyze({ changeRef, impactedAssetIds, details });
      res.json(records);
    } catch (err) { next(err); }
  }

  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { query: queryText } = req.query;
      if (!queryText) { res.status(400).json({ error: 'query required' }); return; }
      const results = await searchService.search(queryText as string);
      res.json(results);
    } catch (err) { next(err); }
  }
}

export const metadataController = new MetadataController();

