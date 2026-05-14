import * as winston from 'winston';
import { WinstonModuleOptions } from 'nest-winston';

export const winstonConfig: WinstonModuleOptions = {
  transports: [
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        process.env.NODE_ENV === 'production'
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize({ all: true }),
              winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
                const ctx = context ? `[${context}]` : '';
                const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
                return `${timestamp} ${level} ${ctx} ${message} ${metaStr}`;
              }),
            ),
      ),
    }),
  ],
};
