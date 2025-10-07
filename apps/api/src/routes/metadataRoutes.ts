import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { metadataController } from '../controllers/metadataController.js';

const router = Router();

router.post('/metadata/assets', authenticate, authorize('metadata.assets','create'), metadataController.createAsset.bind(metadataController));
router.get('/metadata/assets', authenticate, authorize('metadata.assets','read'), metadataController.listAssets.bind(metadataController));
router.get('/metadata/lineage/:assetId', authenticate, authorize('metadata.lineage','read'), metadataController.getLineage.bind(metadataController));
router.post('/glossary', authenticate, authorize('glossary','create'), metadataController.createGlossaryTerm.bind(metadataController));
router.get('/glossary', authenticate, authorize('glossary','read'), metadataController.listGlossaryTerms.bind(metadataController));
router.get('/data-quality', authenticate, authorize('metadata.quality','read'), metadataController.getQualityMetrics.bind(metadataController));
router.post('/impact', authenticate, authorize('metadata.impact','analyze'), metadataController.analyzeImpact.bind(metadataController));
router.get('/search', authenticate, authorize('metadata.search','read'), metadataController.search.bind(metadataController));

export default router;

