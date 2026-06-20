"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestContextMiddleware = void 0;
var crypto_1 = require("crypto");
var requestContextMiddleware = function (req, res, next) {
    var requestId = req.headers['x-request-id'] || (0, crypto_1.randomUUID)();
    // Attach to request and response locals
    req.requestId = requestId;
    res.requestId = requestId;
    res.locals.requestId = requestId;
    // Set response header
    res.setHeader('X-Request-Id', requestId);
    // Store start time for logging
    req.requestStart = Date.now();
    next();
};
exports.requestContextMiddleware = requestContextMiddleware;
