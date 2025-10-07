import { Router } from 'express';
import Joi from 'joi';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { commentController } from '../controllers/commentController.js';

const router = Router();

// Validation schemas
const createCommentSchema = Joi.object({
  dashboardId: Joi.string().min(1).required(),
  body: Joi.string().min(1).max(5000).required(),
  mentions: Joi.array().items(Joi.string()).default([]),
  parentId: Joi.string().allow(null, '').optional(),
});

router.post('/comments', authenticate, validate(createCommentSchema), authorize('comment','create'), commentController.create.bind(commentController));
router.get('/comments', authenticate, commentController.list.bind(commentController));
router.put('/comments/:id/resolve', authenticate, authorize('comment','resolve'), commentController.resolve.bind(commentController));
router.put('/comments/:id/unresolve', authenticate, authorize('comment','resolve'), commentController.unresolve.bind(commentController));

export default router;

