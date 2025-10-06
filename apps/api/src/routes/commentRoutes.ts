import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { commentController } from '../controllers/commentController.js';

const router = Router();

router.post('/comments', authenticate, commentController.create.bind(commentController));
router.get('/comments', authenticate, commentController.list.bind(commentController));
router.put('/comments/:id/resolve', authenticate, commentController.resolve.bind(commentController));

export default router;

