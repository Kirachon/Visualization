/**
 * Filter Routes
 * Story 2.3: Advanced Filtering & Cross-Filtering
 */

import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import {
  evaluateFilterSchema,
  createFilterSetSchema,
  updateFilterSetSchema,
} from '../validators/filterValidators.js';
import {
  evaluateFilter,
  createFilterSet,
  getFilterSet,
  listFilterSets,
  updateFilterSet,
  deleteFilterSet,
} from '../controllers/filterController.js';

const router = Router();

// Filter evaluation
router.post('/filters/evaluate', validate(evaluateFilterSchema), evaluateFilter);

// Filter sets CRUD
router.post('/filters/filter-sets', validate(createFilterSetSchema), createFilterSet);
router.get('/filters/filter-sets', listFilterSets);
router.get('/filters/filter-sets/:id', getFilterSet);
router.put('/filters/filter-sets/:id', validate(updateFilterSetSchema), updateFilterSet);
router.delete('/filters/filter-sets/:id', deleteFilterSet);

export default router;

