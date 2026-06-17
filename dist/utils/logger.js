"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
exports.logger = {
    log: (payload) => {
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
        }
        else if (payload.level === 'warn') {
            console.warn(JSON.stringify(logEntry));
        }
        else {
            console.log(JSON.stringify(logEntry));
        }
    },
    info: (message, meta) => {
        exports.logger.log({ level: 'info', message, ...meta });
    },
    warn: (message, meta) => {
        exports.logger.log({ level: 'warn', message, ...meta });
    },
    error: (message, meta) => {
        exports.logger.log({ level: 'error', message, ...meta });
    },
    debug: (message, meta) => {
        if (process.env.NODE_ENV !== 'production') {
            exports.logger.log({ level: 'debug', message, ...meta });
        }
    }
};
