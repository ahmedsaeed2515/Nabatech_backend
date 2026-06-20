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
exports.logger = void 0;
exports.logger = {
    log: function (payload) {
        // Structured JSON log output
        var logEntry = __assign({ timestamp: new Date().toISOString() }, payload);
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
    info: function (message, meta) {
        exports.logger.log(__assign({ level: 'info', message: message }, meta));
    },
    warn: function (message, meta) {
        exports.logger.log(__assign({ level: 'warn', message: message }, meta));
    },
    error: function (message, meta) {
        exports.logger.log(__assign({ level: 'error', message: message }, meta));
    },
    debug: function (message, meta) {
        if (process.env.NODE_ENV !== 'production') {
            exports.logger.log(__assign({ level: 'debug', message: message }, meta));
        }
    }
};
