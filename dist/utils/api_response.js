"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.created = exports.ok = void 0;
const ok = (res, data, legacyAliases) => {
    const requestId = res.requestId || res.locals.requestId;
    const response = {
        success: true,
        data,
        requestId,
        ...legacyAliases
    };
    return res.status(200).json(response);
};
exports.ok = ok;
const created = (res, data, legacyAliases) => {
    const requestId = res.requestId || res.locals.requestId;
    const response = {
        success: true,
        data,
        requestId,
        ...legacyAliases
    };
    return res.status(201).json(response);
};
exports.created = created;
