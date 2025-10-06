import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { metadataController } from '../controllers/metadataController.js';

const router = Router();

router.post('/metadata/assets', authenticate, metadataController.createAsset.bind(metadataController));
router.get('/metadata/assets', authenticate, metadataController.listAssets.bind(metadataController));
router.get('/metadata/lineage/:assetId', authenticate, metadataController.getLineage.bind(metadataController));
router.post('/glossary', authenticate, metadataController.createGlossaryTerm.bind(metadataController));
router.get('/glossary', authenticate, metadataController.listGlossaryTerms.bind(metadataController));
router.get('/data-quality', authenticate, metadataController.getQualityMetrics.bind(metadataController));
router.post('/impact', authenticate, metadataController.analyzeImpact.bind(metadataController));
router.get('/search', authenticate, metadataController.search.bind(metadataController));

export default router;

