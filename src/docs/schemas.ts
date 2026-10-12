/**
 * @swagger
 * components:
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: false
 *         error:
 *           type: object
 *           properties:
 *             message:
 *               type: string
 *               example: Invalid input parameters
 *             statusCode:
 *               type: integer
 *               example: 400
 *             requestId:
 *               type: string
 *               example: 123e4567-e89b-12d3-a456-426614174000
 *             details:
 *               type: array
 *               items:
 *                 type: object
 *
 *     HealthResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           example: ok
 *         timestamp:
 *           type: string
 *           format: date-time
 *         uptime:
 *           type: number
 *           example: 123.45
 *         responseTimeMs:
 *           type: number
 *           example: 4
 *         services:
 *           type: object
 *           properties:
 *             database:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 latencyMs:
 *                   type: number
 *                   example: 2
 *
 *     MerchantProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         businessName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         walletAddress:
 *           type: string
 *         fiatSettlementCurrency:
 *           type: string
 *           example: USD
 *         isVerified:
 *           type: boolean
 *
 *     ChargeResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         amountUsdc:
 *           type: string
 *           example: "25.0000000"
 *         stellarPayAddress:
 *           type: string
 *         stellarMemo:
 *           type: string
 *         status:
 *           type: string
 *           enum: [PENDING, CONFIRMED, FAILED, EXPIRED, SETTLED]
 *         expiresAt:
 *           type: string
 *           format: date-time
 */
export const openApiSchemas = {};
