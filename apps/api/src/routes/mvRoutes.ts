import { Router } from 'express';
import { createMV, listMV, getMV, updateMV, deleteMV, refreshMV } from '../controllers/mvController.js';

const router = Router();

router.post('/mv', createMV);
router.get('/mv', listMV);
router.get('/mv/:id', getMV);
router.patch('/mv/:id', updateMV);
router.delete('/mv/:id', deleteMV);
router.post('/mv/:id/refresh', refreshMV);

export default router;

