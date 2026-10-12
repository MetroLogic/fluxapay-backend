import { Request, Response } from 'express';
import { prisma } from '../db/prisma';

export const checkHealth = async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  let dbStatus = 'healthy';
  let dbLatencyMs = 0;

  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - dbStart;
  } catch (error) {
    dbStatus = 'unreachable';
  }

  const isHealthy = dbStatus === 'healthy';
  const totalResponseTimeMs = Date.now() - startTime;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTimeMs: totalResponseTimeMs,
    services: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      api: {
        status: 'healthy',
      },
    },
  });
};

export const checkLiveness = (req: Request, res: Response): void => {
  res.status(200).json({ status: 'live', timestamp: new Date().toISOString() });
};

export const checkReadiness = async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ status: 'ready', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(503).json({ status: 'not_ready', error: 'Database unavailable' });
  }
};
