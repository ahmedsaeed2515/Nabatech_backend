import { Request } from 'express';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  level: LogLevel;
  message: string;
  requestId?: string;
  userId?: string;
  [key: string]: any;
}

export const logger = {
  log: (payload: LogPayload) => {
    // Structured JSON log output
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...payload
    };
    
    // In test environment, we might want to suppress non-error logs to keep terminal clean
    if (process.env.NODE_ENV === 'test' && payload.level !== 'error') {
      return;
    }
    
    if (payload.level === 'error') {
      console.error(JSON.stringify(logEntry));
    } else if (payload.level === 'warn') {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  },
  
  info: (message: string, meta?: any) => {
    logger.log({ level: 'info', message, ...meta });
  },
  
  warn: (message: string, meta?: any) => {
    logger.log({ level: 'warn', message, ...meta });
  },
  
  error: (message: string, meta?: any) => {
    logger.log({ level: 'error', message, ...meta });
  },
  
  debug: (message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      logger.log({ level: 'debug', message, ...meta });
    }
  }
};


