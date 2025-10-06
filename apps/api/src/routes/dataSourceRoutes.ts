import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { createDataSourceSchema, updateDataSourceSchema, testConnectionSchema } from '../validators/dataSourceValidators.js';
import {
  createDataSource,
  listDataSources,
  getDataSource,
  updateDataSource,
  deleteDataSource,
  testDataSource,
  discoverSchema,
} from '../controllers/dataSourceController.js';

const router = Router();

router.post('/data-sources', validate(createDataSourceSchema), createDataSource);
router.post('/data-sources/test', validate(testConnectionSchema), testDataSource);
router.get('/data-sources', listDataSources);
router.get('/data-sources/:id', getDataSource);
router.get('/data-sources/:id/schema', discoverSchema);
router.put('/data-sources/:id', validate(updateDataSourceSchema), updateDataSource);
router.delete('/data-sources/:id', deleteDataSource);

export default router;

