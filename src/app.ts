import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { specs } from './docs/swagger';
import { prisma } from './db/prisma';
import { configureCors } from './middlewares/cors';
import { configureSecurityHeaders } from './middlewares/securityHeaders';
import { correlationIdMiddleware, httpLoggerMiddleware } from './middlewares/requestLogger';
import { globalRateLimiter } from './middlewares/rateLimiter';
import { healthRouter } from './routes/healthRoutes';
import { notFoundHandler, globalErrorHandler } from './middlewares/errorHandler';

const app = express();

// Security Middlewares
app.use(configureSecurityHeaders());
app.use(configureCors());

// Request Parsing & Tracing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(correlationIdMiddleware);
app.use(httpLoggerMiddleware);

// Rate Limiting
app.use(globalRateLimiter);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health Checks
app.use('/health', healthRouter);

// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

export { app, prisma };
