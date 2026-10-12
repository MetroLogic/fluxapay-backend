import { Server } from 'http';
import { logger } from './logger';
import { disconnectDatabase } from '../db/prisma';

export interface GracefulShutdownConfig {
  server: Server;
  timeoutMs?: number;
}

export const setupGracefulShutdown = ({ server, timeoutMs = 10000 }: GracefulShutdownConfig): void => {
  let isShuttingDown = false;

  const handleShutdown = async (signal: string) => {
    if (isShuttingDown) {
      logger.warn(`Shutdown already in progress. Ignoring additional signal: ${signal}`);
      return;
    }

    isShuttingDown = true;
    logger.info(`Received ${signal}. Initiating graceful shutdown...`);

    const forceTimer = setTimeout(() => {
      logger.error('Graceful shutdown timeout exceeded. Forcefully killing process.');
      process.exit(1);
    }, timeoutMs);

    forceTimer.unref();

    try {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) {
            return reject(err);
          }
          logger.info('HTTP server closed cleanly. No new connections accepted.');
          resolve();
        });
      });

      await disconnectDatabase();
      logger.info('Prisma database connection closed successfully.');

      clearTimeout(forceTimer);
      logger.info('All resources cleaned up. Process exiting cleanly.');
      process.exit(0);
    } catch (error) {
      logger.error('Error occurred during graceful shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));

  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception thrown:', err);
    handleShutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection:', reason);
    handleShutdown('UNHANDLED_REJECTION');
  });
};
