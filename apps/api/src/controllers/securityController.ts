import { Request, Response, NextFunction } from 'express';
import { retentionService } from '../services/retentionService.js';
import { gdprService } from '../services/gdprService.js';
import { securityScanService } from '../services/securityScanService.js';
import { networkSecurityService } from '../services/networkSecurityService.js';
import { auditService } from '../services/auditService.js';

export class SecurityController {
  async createRetentionPolicy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { dataType, ttlDays, hardDelete } = req.body;
      if (!dataType || !ttlDays) { res.status(400).json({ error: 'dataType and ttlDays required' }); return; }
      const policy = await retentionService.createPolicy({ dataType, ttlDays, hardDelete });
      res.status(201).json(policy);
    } catch (err) { next(err); }
  }

  async listRetentionPolicies(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const policies = await retentionService.listPolicies();
      res.json(policies);
    } catch (err) { next(err); }
  }

  async createGdprRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { subjectId, type } = req.body;
      if (!subjectId || !type) { res.status(400).json({ error: 'subjectId and type required' }); return; }
      const request = await gdprService.createRequest({ subjectId, type });
      res.status(201).json(request);
    } catch (err) { next(err); }
  }

  async listGdprRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { subjectId, status } = req.query;
      const requests = await gdprService.listRequests({ subjectId: subjectId as string, status: status as string });
      res.json(requests);
    } catch (err) { next(err); }
  }

  async executeGdprRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { type } = req.body;
      if (type === 'rtbf') {
        await gdprService.executeRTBF(id);
        res.json({ message: 'RTBF executed' });
      } else if (type === 'export') {
        const data = await gdprService.executeExport(id);
        res.json(data);
      } else {
        res.status(400).json({ error: 'Invalid type' });
      }
    } catch (err) { next(err); }
  }

  async listVulnFindings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { severity, status } = req.query;
      const findings = await securityScanService.listFindings({ severity: severity as string, status: status as string });
      res.json(findings);
    } catch (err) { next(err); }
  }

  async listIdsEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { srcIp, type, limit } = req.query;
      const events = await networkSecurityService.listEvents({ srcIp: srcIp as string, type: type as string, limit: limit ? parseInt(limit as string, 10) : 100 });
      res.json(events);
    } catch (err) { next(err); }
  }

  async verifyAuditChain(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = (req as any).user?.tenantId || (req.query.tenantId as string);
      const result = await auditService.verifyChain(tenantId);
      res.json(result);
    } catch (err) { next(err); }
  }
}

export const securityController = new SecurityController();

