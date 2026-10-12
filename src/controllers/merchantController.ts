import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'crypto';
import { prisma } from '../db/prisma';
import { signToken } from '../middlewares/jwtAuth';
import { BadRequestError, UnauthorizedError, NotFoundError } from '../errors/AppError';

export const registerMerchant = async (req: Request, res: Response): Promise<void> => {
  const { businessName, email, password, walletAddress, fiatSettlementCurrency = 'USD' } = req.body;

  if (!businessName || !email || !password) {
    throw new BadRequestError('businessName, email, and password are required.');
  }

  const existing = await prisma.merchant.findUnique({ where: { email } });
  if (existing) {
    throw new BadRequestError('A merchant with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // Generate initial live API Key
  const rawKey = `flx_live_${randomBytes(24).toString('hex')}`;
  const keyHash = createHash('sha256').update(rawKey).digest('hex');
  const maskedKey = `${rawKey.slice(0, 10)}...${rawKey.slice(-4)}`;

  const merchant = await prisma.merchant.create({
    data: {
      businessName,
      email,
      passwordHash,
      walletAddress,
      fiatSettlementCurrency,
      isVerified: true,
      apiKeys: {
        create: {
          name: 'Primary Live Key',
          keyHash,
          maskedKey,
          status: 'ACTIVE',
        },
      },
    },
    include: { apiKeys: true },
  });

  const token = signToken({ id: merchant.id, email: merchant.email, role: merchant.role });

  res.status(201).json({
    success: true,
    message: 'Merchant registered successfully.',
    data: {
      token,
      apiKey: rawKey, // Shown once
      merchant: {
        id: merchant.id,
        businessName: merchant.businessName,
        email: merchant.email,
        walletAddress: merchant.walletAddress,
        fiatSettlementCurrency: merchant.fiatSettlementCurrency,
      },
    },
  });
};

export const loginMerchant = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    throw new BadRequestError('Email and password are required.');
  }

  const merchant = await prisma.merchant.findUnique({ where: { email } });
  if (!merchant) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  const match = await bcrypt.compare(password, merchant.passwordHash);
  if (!match) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  const token = signToken({ id: merchant.id, email: merchant.email, role: merchant.role });

  res.status(200).json({
    success: true,
    data: {
      token,
      merchant: {
        id: merchant.id,
        businessName: merchant.businessName,
        email: merchant.email,
        walletAddress: merchant.walletAddress,
        fiatSettlementCurrency: merchant.fiatSettlementCurrency,
      },
    },
  });
};

export const getMerchantProfile = async (req: Request, res: Response): Promise<void> => {
  const merchantId = req.user?.id;
  if (!merchantId) {
    throw new UnauthorizedError('Authentication required.');
  }

  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    select: {
      id: true,
      businessName: true,
      email: true,
      role: true,
      walletAddress: true,
      fiatSettlementCurrency: true,
      isVerified: true,
      createdAt: true,
      apiKeys: {
        select: {
          id: true,
          name: true,
          maskedKey: true,
          status: true,
          createdAt: true,
          lastUsedAt: true,
        },
      },
      _count: {
        select: {
          charges: true,
          customers: true,
          invoices: true,
        },
      },
    },
  });

  if (!merchant) {
    throw new NotFoundError('Merchant not found.');
  }

  res.status(200).json({ success: true, data: merchant });
};
