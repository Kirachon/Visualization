import { Request, Response, NextFunction } from 'express';
import { dashboardSharingService } from '../services/dashboardSharingService.js';

export const shareDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId || req.body.createdBy;
    const { userId: shareUserId, permission } = req.body;
    const share = await dashboardSharingService.shareWithUser(
      { dashboardId: req.params.id, userId: shareUserId, permission },
      userId
    );
    res.status(201).json(share);
  } catch (err) {
    next(err);
  }
};

export const listDashboardShares = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const shares = await dashboardSharingService.listShares(req.params.id);
    res.json(shares);
  } catch (err) {
    next(err);
  }
};

export const revokeShare = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ok = await dashboardSharingService.removeShare(req.params.id, req.params.userId);
    if (!ok) { res.status(404).json({ error: 'Share not found' }); return; }
    res.status(204).send();
    return;
  } catch (err) {
    next(err);
  }
};

export const createPublicLink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = (req as any).user?.userId || req.body.createdBy;
    const { expiresAt } = req.body;
    const link = await dashboardSharingService.createPublicLink(
      { dashboardId: req.params.id, expiresAt },
      userId
    );
    res.status(201).json(link);
  } catch (err) {
    next(err);
  }
};

export const listPublicLinks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const links = await dashboardSharingService.listPublicLinks(req.params.id);
    res.json(links);
  } catch (err) {
    next(err);
  }
};

export const getPublicDashboard = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const link = await dashboardSharingService.getPublicLink(req.params.token);
    if (!link) { res.status(404).json({ error: 'Invalid or expired link' }); return; }
    res.json({ dashboardId: link.dashboardId });
    return;
  } catch (err) {
    next(err);
  }
};

export const revokePublicLink = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ok = await dashboardSharingService.revokePublicLink(req.params.linkId);
    if (!ok) { res.status(404).json({ error: 'Link not found' }); return; }
    res.status(204).send();
    return;
  } catch (err) {
    next(err);
  }
};

