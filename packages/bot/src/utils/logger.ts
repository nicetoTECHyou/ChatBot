// ============================================================
// StreamForge AI Bot - Logger
// ============================================================

import winston from 'winston';
import { config } from '../config';

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, service }) => {
  return `${ts} [${service || 'bot'}] ${level}: ${message}`;
});

export const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  defaultMeta: { service: 'streamforge' },
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
  ],
});
