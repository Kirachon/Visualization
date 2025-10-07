/**
 * Connector Routes
 * 
 * API routes for database connector operations:
 * - Test connections
 * - Introspect schemas
 * - Import data from files
 * - Monitor import job progress
 */

import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import {
  testConnectionSchema,
  introspectSchemaSchema,
  startImportSchema,
} from '../validators/connectorValidators.js';
import {
  testConnection,
  introspectSchema,
  startImport,
  getImportJob,
  listImportJobs,
  getDataSourceHealth,
} from '../controllers/connectorController.js';

const router = Router();

// Test database connection
router.post('/connectors/test', validate(testConnectionSchema), testConnection);

// Discover schema from database
router.post('/connectors/introspect', validate(introspectSchemaSchema), introspectSchema);

// Start file import job
router.post('/connectors/import', validate(startImportSchema), startImport);

// Get import job status and progress
router.get('/connectors/jobs/:id', getImportJob);

// List import jobs for current tenant
router.get('/connectors/jobs', listImportJobs);

// Get health status for a data source
router.get('/connectors/health/:dataSourceId', getDataSourceHealth);

export default router;

