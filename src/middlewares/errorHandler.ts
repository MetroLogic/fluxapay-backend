import { Request, Response, NextFunction } from 'express';
import { AppError, NotFoundError } from '../errors/AppError';
import { logger } from '../utils/logger';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  next(new NotFoundError(`Endpoint not found: ${req.method} ${req.originalUrl}`));
};

export const globalErrorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const isOperational = isAppError ? err.isOperational : false;
  const requestId = req.requestId;

  if (statusCode >= 500) {
    logger.error(`[UnhandledError] ${err.message}`, {
      stack: err.stack,
      requestId,
      url: req.originalUrl,
      method: req.method,
    });
  } else {
    logger.warn(`[ClientError] ${err.message}`, {
      statusCode,
      requestId,
      url: req.originalUrl,
    });
  }

  const responsePayload: Record<string, unknown> = {
    success: false,
    error: {
      message: isOperational || process.env.NODE_ENV !== 'production' ? err.message : 'Internal server error',
      statusCode,
      requestId,
      ...(isAppError && err.details ? { details: err.details } : {}),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  };

  res.status(statusCode).json(responsePayload);
};
