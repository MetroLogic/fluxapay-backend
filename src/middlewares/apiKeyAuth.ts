import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { prisma } from '../db/prisma';
import { UnauthorizedError } from '../errors/AppError';

export interface AuthenticatedMerchant {
  merchantId: string;
  keyId: string;
}

declare global {
  namespace Express {
    interface Request {
      merchant?: AuthenticatedMerchant;
    }
  }
}

export const apiKeyAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const apiKey = req.headers['x-api-key'] as string;
  if (!apiKey) {
    return next(new UnauthorizedError('Missing required x-api-key header.'));
  }

  const keyHash = createHash('sha256').update(apiKey).digest('hex');

  try {
    const keyRecord = await prisma.apiKey.findUnique({
      where: { keyHash },
      include: { merchant: true },
    });

    if (!keyRecord || keyRecord.status !== 'ACTIVE') {
      return next(new UnauthorizedError('Invalid or revoked API key.'));
    }

    if (keyRecord.expiresAt && keyRecord.expiresAt < new Date()) {
      return next(new UnauthorizedError('API key has expired.'));
    }

    req.merchant = {
      merchantId: keyRecord.merchantId,
      keyId: keyRecord.id,
    };

    next();
  } catch (error) {
    next(error);
  }
};
