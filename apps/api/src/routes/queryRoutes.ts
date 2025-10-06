import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { executeQuerySchema } from '../validators/queryValidators.js';
import { executeQuery } from '../controllers/queryController.js';

const router = Router();

router.post('/data-sources/:id/query', validate(executeQuerySchema), executeQuery);

export default router;

