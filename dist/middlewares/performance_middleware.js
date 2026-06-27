"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.performanceMonitor = void 0;
const logger_1 = require("../utils/logger");
/**
 * Middleware to track API response times and log slow requests
 */
const performanceMonitor = (req, res, next) => {
    const start = process.hrtime();
    // Intercept the finish event which fires when the response is fully sent
    res.on('finish', () => {
        const diff = process.hrtime(start);
        // Convert to milliseconds
        const timeMs = (diff[0] * 1e3 + diff[1] * 1e-6);
        // Log slow requests (e.g., > 2000ms)
        if (timeMs > 2000) {
            logger_1.logger.warn(`Slow API Response Detected - method: ${req.method}, url: ${req.originalUrl || req.url}, timeMs: ${timeMs.toFixed(2)}, statusCode: ${res.statusCode}`);
        }
        else {
            // Trace log for normal requests
            logger_1.logger.debug(`API trace - method: ${req.method}, url: ${req.originalUrl || req.url}, timeMs: ${timeMs.toFixed(2)}`);
        }
    });
    next();
};
exports.performanceMonitor = performanceMonitor;
