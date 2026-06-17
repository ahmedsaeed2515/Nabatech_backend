"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const app_error_1 = require("../utils/app_error");
const logger_1 = require("../utils/logger");
const errorHandler = (err, req, res, next) => {
    const requestId = req.requestId || res.locals.requestId;
    let error = { ...err };
    error.message = err.message;
    // Log error
    logger_1.logger.error(error.message || 'Server Error', {
        requestId,
        url: req.originalUrl,
        method: req.method,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        userId: req.user?.id,
    });
    if (err instanceof app_error_1.AppError || err.isOperational || (err.statusCode && err.code)) {
        const response = {
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
        const response = {
            success: false,
            error: { code: 'CONFLICT', status: 409, message },
            requestId,
            message
        };
        return res.status(409).json(response);
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map((val) => val.message).join(', ');
        const response = {
            success: false,
            error: { code: 'VALIDATION_FAILED', status: 400, message },
            requestId,
            message
        };
        return res.status(400).json(response);
    }
    // Fallback for unhandled errors
    const response = {
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
exports.errorHandler = errorHandler;
