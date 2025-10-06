import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { workspaceController } from '../controllers/workspaceController.js';

const router = Router();

router.post('/workspaces', authenticate, workspaceController.create.bind(workspaceController));
router.get('/workspaces', authenticate, workspaceController.list.bind(workspaceController));
router.get('/workspaces/:id', authenticate, workspaceController.get.bind(workspaceController));
router.put('/workspaces/:id', authenticate, workspaceController.update.bind(workspaceController));
router.delete('/workspaces/:id', authenticate, workspaceController.remove.bind(workspaceController));

export default router;

