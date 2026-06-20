"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeErrorMessage = exports.isProviderError = exports.toProviderError = exports.AiProviderError = void 0;
var AiProviderError = /** @class */ (function (_super) {
    __extends(AiProviderError, _super);
    function AiProviderError(message, options) {
        var _a;
        var _this = _super.call(this, message) || this;
        _this.name = "AiProviderError";
        _this.code = (options === null || options === void 0 ? void 0 : options.code) || "AI_PROVIDER_ERROR";
        _this.isUpstream = (_a = options === null || options === void 0 ? void 0 : options.isUpstream) !== null && _a !== void 0 ? _a : true;
        return _this;
    }
    return AiProviderError;
}(Error));
exports.AiProviderError = AiProviderError;
var toProviderError = function (error, fallbackMessage, code) {
    var message = error instanceof Error ? error.message : fallbackMessage;
    return new AiProviderError(message || fallbackMessage, { code: code, isUpstream: true });
};
exports.toProviderError = toProviderError;
var isProviderError = function (error) {
    return error instanceof AiProviderError;
};
exports.isProviderError = isProviderError;
var sanitizeErrorMessage = function (error) {
    var text = error instanceof Error ? error.message : String(error);
    return text
        .replace(/Bearer\s+[A-Za-z0-9\-_\.]+/gi, "Bearer [REDACTED]")
        .replace(/https?:\/\/\S+/gi, "[URL]")
        .slice(0, 300);
};
exports.sanitizeErrorMessage = sanitizeErrorMessage;
