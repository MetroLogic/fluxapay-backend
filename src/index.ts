import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';
import { connectDatabase } from './db/prisma';
import { setupGracefulShutdown } from './utils/shutdown';

const startServer = async () => {
  await connectDatabase();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server successfully started on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`Swagger UI documentation available at http://localhost:${env.PORT}/api-docs`);
  });

  setupGracefulShutdown({ server });
};

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
