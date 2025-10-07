import crypto from 'crypto';

export interface EscalationRequest {
  id: string;
  tenantId: string;
  userId: string;
  resource: string;
  action: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
  approvedAt?: number;
  expiresAt?: number;
  ttlMs?: number;
  approvedBy?: string;
}


export class AccessEscalationService {
  private store: Map<string, EscalationRequest> = new Map();

  create(tenantId: string, userId: string, resource: string, action: string, reason?: string, ttlMs: number = 15 * 60 * 1000): EscalationRequest {
    const id = crypto.randomUUID ? crypto.randomUUID() : crypto.createHash('sha1').update(`${tenantId}:${userId}:${resource}:${action}:${Date.now()}`).digest('hex');
    const req: EscalationRequest = {
      id,
      tenantId,
      userId,
      resource,
      action,
      reason,
      status: 'pending',
      createdAt: Date.now(),
      ttlMs,
    };
    this.store.set(id, req);
    return req;
  }

  approve(id: string, approvedBy: string): EscalationRequest | undefined {
    const req = this.store.get(id);
    if (!req) return undefined;
    req.status = 'approved';
    req.approvedAt = Date.now();
    req.expiresAt = req.approvedAt + (req.ttlMs || 15 * 60 * 1000);
    req.approvedBy = approvedBy;
    this.store.set(id, req);
    return req;
  }

  list(tenantId: string): EscalationRequest[] {
    return Array.from(this.store.values()).filter(r => r.tenantId === tenantId);
  }

  hasGrant(userId: string, tenantId: string | undefined, resource: string, action: string): boolean {
    const now = Date.now();
    for (const r of this.store.values()) {
      if (r.userId === userId && (!tenantId || r.tenantId === tenantId) && r.resource === resource && r.action === action && r.status === 'approved') {
        if (!r.expiresAt || r.expiresAt > now) {
          return true;
        }
      }
    }
    return false;
  }
}

export const escalationService = new AccessEscalationService();

