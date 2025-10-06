import { Request, Response, NextFunction } from 'express';
import { auditService } from '../services/auditService.js';

export const auditLog = (action: string, resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function (data: any) {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const tenantId = (req as any).user?.tenantId || req.body?.tenantId || req.query?.tenantId;
        const userId = (req as any).user?.userId || req.body?.ownerId || req.body?.createdBy;
        
        if (tenantId) {
          auditService.log({
            tenantId,
            userId,
            action,
            resourceType,
            resourceId: req.params.id || undefined,
            details: {
              method: req.method,
              path: req.path,
              body: req.body,
            },
            ipAddress: req.ip,
            userAgent: req.get('user-agent'),
          }).catch((err) => {
            console.error('Failed to log audit:', err);
          });
        }
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};

