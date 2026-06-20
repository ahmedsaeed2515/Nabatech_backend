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
exports.created = exports.ok = void 0;
var ok = function (res, data, legacyAliases) {
    var requestId = res.requestId || res.locals.requestId;
    var response = __assign({ success: true, data: data, requestId: requestId }, legacyAliases);
    return res.status(200).json(response);
};
exports.ok = ok;
var created = function (res, data, legacyAliases) {
    var requestId = res.requestId || res.locals.requestId;
    var response = __assign({ success: true, data: data, requestId: requestId }, legacyAliases);
    return res.status(201).json(response);
};
exports.created = created;
