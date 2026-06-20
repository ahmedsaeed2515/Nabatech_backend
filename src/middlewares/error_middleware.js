"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
var app_error_1 = require("../utils/app_error");
var logger_1 = require("../utils/logger");
var errorHandler = function (err, req, res, next) {
    var _a;
    var requestId = req.requestId || res.locals.requestId;
    var error = __assign({}, err);
    error.message = err.message;
    // Log error
    logger_1.logger.error(error.message || 'Server Error', {
        requestId: requestId,
        url: req.originalUrl,
        method: req.method,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
        userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
    });
    if (err instanceof app_error_1.AppError || err.isOperational || (err.statusCode && err.code)) {
        var response_1 = {
            success: false,
            error: {
                code: err.code,
                status: err.statusCode,
                message: (process.env.NODE_ENV === 'production' && !err.isOperational) ? 'Internal Server Error' : err.message,
                details: err.details
            },
            requestId: requestId,
            message: (process.env.NODE_ENV === 'production' && !err.isOperational) ? 'Internal Server Error' : err.message
        };
        return res.status(err.statusCode).json(response_1);
    }
    // Mongoose duplicate key
    if (err.code === 11000) {
        var message = 'Duplicate field value entered';
        var response_2 = {
            success: false,
            error: { code: 'CONFLICT', status: 409, message: message },
            requestId: requestId,
            message: message
        };
        return res.status(409).json(response_2);
    }
    // Mongoose validation error
    if (err.name === 'ValidationError') {
        var message = Object.values(err.errors).map(function (val) { return val.message; }).join(', ');
        var response_3 = {
            success: false,
            error: { code: 'VALIDATION_FAILED', status: 400, message: message },
            requestId: requestId,
            message: message
        };
        return res.status(400).json(response_3);
    }
    // Fallback for unhandled errors
    var response = {
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            status: 500,
            message: 'Server Error'
        },
        requestId: requestId,
        message: 'Server Error'
    };
    return res.status(500).json(response);
};
exports.errorHandler = errorHandler;
