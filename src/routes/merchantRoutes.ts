import { Router } from 'express';
import { registerMerchant, loginMerchant, getMerchantProfile } from '../controllers/merchantController';
import { asyncHandler } from '../utils/asyncHandler';
import { verifyJwtMiddleware } from '../middlewares/jwtAuth';
import { authRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

/**
 * @swagger
 * /api/v1/merchants/register:
 *   post:
 *     summary: Register a new merchant and generate live API key
 *     tags:
 *       - Merchants
 *     responses:
 *       201:
 *         description: Merchant registered
 */
router.post('/register', authRateLimiter, asyncHandler(registerMerchant));

/**
 * @swagger
 * /api/v1/merchants/login:
 *   post:
 *     summary: Merchant login and retrieve JWT session token
 *     tags:
 *       - Merchants
 *     responses:
 *       200:
 *         description: Authenticated successfully
 */
router.post('/login', authRateLimiter, asyncHandler(loginMerchant));

/**
 * @swagger
 * /api/v1/merchants/me:
 *   get:
 *     summary: Retrieve merchant profile, API keys, and metrics
 *     security:
 *       - bearerAuth: []
 *     tags:
 *       - Merchants
 *     responses:
 *       200:
 *         description: Merchant profile returned
 */
router.get('/me', verifyJwtMiddleware, asyncHandler(getMerchantProfile));

export { router as merchantRouter };
