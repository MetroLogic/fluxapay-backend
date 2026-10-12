import winston from 'winston';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

const customFormat = printf(({ level, message, timestamp, stack, requestId, ...metadata }) => {
  let log = `${timestamp} [${level}]`;
  if (requestId) {
    log += ` [Req:${requestId}]`;
  }
  log += `: ${message}`;
  if (Object.keys(metadata).length > 0) {
    log += ` ${JSON.stringify(metadata)}`;
  }
  if (stack) {
    log += `\n${stack}`;
  }
  return log;
});

const isProduction = process.env.NODE_ENV === 'production';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    isProduction ? json() : combine(colorize(), customFormat)
  ),
  transports: [
    new winston.transports.Console(),
  ],
  exitOnError: false,
});
