"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    constructor({ message, statusCode, code, isOperational = true, details }) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.details = details;
        Error.captureStackTrace(this);
    }
}
exports.AppError = AppError;
