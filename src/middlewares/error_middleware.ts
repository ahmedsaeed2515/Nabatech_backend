import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app_error';
import { ApiErrorResponse } from '../utils/api_response';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = (req as any).requestId || res.locals.requestId;
  
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error(error.message || 'Server Error', {
    requestId,
    url: req.originalUrl,
    method: req.method,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    userId: (req as any).user?.id,
  });

  if (err instanceof AppError || err.isOperational || (err.statusCode && err.code)) {
    const response: ApiErrorResponse = {
      success: false,
      error: {
        code: err.code,
        status: err.statusCode,
        message: (process.env.NODE_ENV === 'production' && !err.isOperational) ? 'Internal Server Error' : err.message,
        details: err.details
      },
      requestId,
      message: (process.env.NODE_ENV === 'production' && !err.isOperational) ? 'Internal Server Error' : err.message
    };
    return res.status(err.statusCode).json(response);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    const response: ApiErrorResponse = {
      success: false,
      error: { code: 'CONFLICT', status: 409, message },
      requestId,
      message
    };
    return res.status(409).json(response);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((val: any) => val.message).join(', ');
    const response: ApiErrorResponse = {
      success: false,
      error: { code: 'VALIDATION_FAILED', status: 400, message },
      requestId,
      message
    };
    return res.status(400).json(response);
  }

  // Fallback for unhandled errors
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      status: 500,
      message: 'Server Error'
    },
    requestId,
    message: 'Server Error'
  };

  return res.status(500).json(response);
};


