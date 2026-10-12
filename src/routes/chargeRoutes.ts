import { Router } from 'express';
import { createCharge, getCharge, verifyCharge, getFxRate } from '../controllers/chargeController';
import { asyncHandler } from '../utils/asyncHandler';
import { apiKeyAuthMiddleware } from '../middlewares/apiKeyAuth';

const router = Router();

/**
 * @swagger
 * /api/v1/charges/rates:
 *   get:
 *     summary: Get live FX quotes for fiat to Stellar USDC
 *     tags:
 *       - Quotes
 *     parameters:
 *       - in: query
 *         name: amount
 *         schema:
 *           type: number
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Live quote
 */
router.get('/rates', getFxRate);

/**
 * @swagger
 * /api/v1/charges:
 *   post:
 *     summary: Create a Stellar payment charge
 *     security:
 *       - apiKeyAuth: []
 *     tags:
 *       - Charges
 *     responses:
 *       201:
 *         description: Charge created
 */
router.post('/', apiKeyAuthMiddleware, asyncHandler(createCharge));

/**
 * @swagger
 * /api/v1/charges/{id}:
 *   get:
 *     summary: Get charge status
 *     tags:
 *       - Charges
 *     responses:
 *       200:
 *         description: Charge found
 */
router.get('/:id', asyncHandler(getCharge));

/**
 * @swagger
 * /api/v1/charges/{id}/verify:
 *   post:
 *     summary: Verify charge payment on Stellar blockchain
 *     tags:
 *       - Charges
 *     responses:
 *       200:
 *         description: Payment confirmed on-chain
 */
router.post('/:id/verify', asyncHandler(verifyCharge));

export { router as chargeRouter };
