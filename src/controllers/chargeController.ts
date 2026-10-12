import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { stellarService } from '../services/stellarService';
import { webhookService } from '../services/webhookService';
import { BadRequestError, NotFoundError } from '../errors/AppError';

export const createCharge = async (req: Request, res: Response): Promise<void> => {
  const merchantId = req.merchant?.merchantId || req.user?.id;
  if (!merchantId) {
    throw new BadRequestError('Merchant authentication required.');
  }

  const { amountUsdc, amountFiat, fiatCurrency = 'USD', description, customerEmail } = req.body;

  let calculatedUsdc = amountUsdc;
  if (!calculatedUsdc && amountFiat) {
    const quote = stellarService.getFxQuote(amountFiat, fiatCurrency);
    calculatedUsdc = quote.amountOut;
  }

  if (!calculatedUsdc || calculatedUsdc <= 0) {
    throw new BadRequestError('Valid amountUsdc or amountFiat is required.');
  }

  // Find or create customer if email is provided
  let customerId: string | undefined;
  if (customerEmail) {
    const customer = await prisma.customer.upsert({
      where: {
        merchantId_email: {
          merchantId,
          email: customerEmail,
        },
      },
      update: {},
      create: {
        merchantId,
        email: customerEmail,
      },
    });
    customerId = customer.id;
  }

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
  });

  const stellarPayAddress = merchant?.walletAddress || 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
  const stellarMemo = stellarService.generatePaymentMemo();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiration

  const charge = await prisma.charge.create({
    data: {
      merchantId,
      customerId,
      amountUsdc: calculatedUsdc,
      amountFiat,
      fiatCurrency,
      stellarPayAddress,
      stellarMemo,
      description,
      status: 'PENDING',
      expiresAt,
    },
  });

  // Dispatch webhook
  await webhookService.dispatchEvent(merchantId, 'charge.created', {
    chargeId: charge.id,
    amountUsdc: charge.amountUsdc,
    stellarMemo,
    stellarPayAddress,
  });

  res.status(201).json({
    success: true,
    data: {
      id: charge.id,
      amountUsdc: charge.amountUsdc,
      amountFiat: charge.amountFiat,
      fiatCurrency: charge.fiatCurrency,
      stellarPayAddress: charge.stellarPayAddress,
      stellarMemo: charge.stellarMemo,
      status: charge.status,
      expiresAt: charge.expiresAt,
      paymentInstructions: {
        network: 'Stellar (Public / Testnet)',
        asset: 'USDC',
        destination: charge.stellarPayAddress,
        memoType: 'text',
        memo: charge.stellarMemo,
      },
    },
  });
};

export const getCharge = async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  const charge = await prisma.charge.findUnique({
    where: { id },
    include: { customer: true },
  });

  if (!charge) {
    throw new NotFoundError('Charge not found');
  }

  res.status(200).json({
    success: true,
    data: charge,
  });
};

export const verifyCharge = async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { txHash } = req.body;

  if (!txHash) {
    throw new BadRequestError('txHash is required to verify on Stellar.');
  }

  const charge = await prisma.charge.findUnique({
    where: { id },
  });

  if (!charge) {
    throw new NotFoundError('Charge not found');
  }

  if (charge.status === 'CONFIRMED' || charge.status === 'SETTLED') {
    res.status(200).json({
      success: true,
      message: 'Charge is already confirmed.',
      data: charge,
    });
    return;
  }

  const verification = await stellarService.verifyTransactionOnChain(
    txHash,
    charge.stellarMemo || undefined,
    Number(charge.amountUsdc)
  );

  if (!verification.verified) {
    res.status(400).json({
      success: false,
      message: verification.message || 'On-chain verification failed.',
      verification,
    });
    return;
  }

  // Update charge to CONFIRMED
  const updatedCharge = await prisma.charge.update({
    where: { id },
    data: {
      status: 'CONFIRMED',
      txHash,
      confirmedAt: new Date(),
    },
  });

  // Dispatch webhook
  await webhookService.dispatchEvent(charge.merchantId, 'charge.confirmed', {
    chargeId: updatedCharge.id,
    txHash,
    amountReceived: verification.amountReceived,
  });

  res.status(200).json({
    success: true,
    message: 'Charge confirmed successfully on Stellar.',
    data: updatedCharge,
  });
};

export const getFxRate = (req: Request, res: Response): void => {
  const { amount = 100, currency = 'USD' } = req.query;
  const quote = stellarService.getFxQuote(Number(amount), String(currency));
  res.status(200).json({ success: true, data: quote });
};
