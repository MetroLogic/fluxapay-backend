import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export const correlationIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const headerId = req.headers['x-request-id'];
  const requestId = Array.isArray(headerId) ? headerId[0] : headerId || randomUUID();
  req.requestId = requestId;
  res.setHeader('x-request-id', requestId);
  next();
};

export const httpLoggerMiddleware = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: {
      write: (message: string) => {
        logger.info(message.trim());
      },
    },
    skip: (req) => req.url === '/health' || req.url === '/health/liveness',
  }
);
