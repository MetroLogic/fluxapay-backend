import { Router } from 'express';
import { checkHealth, checkLiveness, checkReadiness } from '../controllers/healthController';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     summary: System health check
 *     description: Checks server health, uptime, and PostgreSQL connectivity
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: All services are healthy
 *       503:
 *         description: Database is unreachable or degraded
 */
router.get('/', asyncHandler(checkHealth));

/**
 * @swagger
 * /health/liveness:
 *   get:
 *     summary: Kubernetes liveness probe
 *     description: Indicates if the HTTP server process is running
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Server is live
 */
router.get('/liveness', checkLiveness);

/**
 * @swagger
 * /health/readiness:
 *   get:
 *     summary: Kubernetes readiness probe
 *     description: Indicates if the service is ready to accept traffic with DB connection
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Ready for incoming requests
 *       503:
 *         description: Dependencies not ready
 */
router.get('/readiness', asyncHandler(checkReadiness));

export { router as healthRouter };
