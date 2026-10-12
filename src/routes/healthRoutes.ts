import { Router } from 'express';
import { checkHealth, checkLiveness, checkReadiness } from '../controllers/healthController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.get('/', asyncHandler(checkHealth));
router.get('/liveness', checkLiveness);
router.get('/readiness', asyncHandler(checkReadiness));

export { router as healthRouter };
