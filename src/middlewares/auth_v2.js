"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectV2 = void 0;
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var user_model_1 = __importDefault(require("../models/user_model"));
var app_error_1 = require("../utils/app_error");
var env_1 = require("../config/env");
/**
 * protectV2
 * ─────────
 * Validates the Bearer access token issued by generateAccessToken().
 * Performs the same three security gates as the V1 `protect` middleware:
 *   1. Signature verification against JWT_SECRET
 *   2. Account-disabled check  (status === 'disabled')
 *   3. Token-version check     (prevents stale tokens after password reset / logout-all)
 */
var protectV2 = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var token, jwtSecret, decoded, user, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(req.headers.authorization && req.headers.authorization.startsWith('Bearer'))) return [3 /*break*/, 4];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                token = req.headers.authorization.split(' ')[1];
                jwtSecret = env_1.env.JWT_SECRET;
                if (!jwtSecret) {
                    return [2 /*return*/, next(new app_error_1.AppError({ code: 'SERVER_ERROR', statusCode: 500, message: 'JWT_SECRET is not configured' }))];
                }
                decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
                return [4 /*yield*/, user_model_1.default.findById(decoded.id).select('-passwordHash')];
            case 2:
                user = _a.sent();
                if (!user) {
                    return [2 /*return*/, next(new app_error_1.AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Not authorized, user not found' }))];
                }
                // ── 2. Account status gate ─────────────────────────────────────────
                if (user.status === 'disabled') {
                    return [2 /*return*/, next(new app_error_1.AppError({ code: 'AUTH_ACCOUNT_DISABLED', statusCode: 401, message: 'Account disabled' }))];
                }
                // ── 3. Token-version gate (invalidates tokens after password reset / logout-all) ─
                if (user.tokenVersion !== decoded.tokenVersion) {
                    return [2 /*return*/, next(new app_error_1.AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Token invalid or revoked' }))];
                }
                req.user = user;
                return [2 /*return*/, next()];
            case 3:
                err_1 = _a.sent();
                return [2 /*return*/, next(new app_error_1.AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Not authorized, token failed' }))];
            case 4:
                if (!token) {
                    return [2 /*return*/, next(new app_error_1.AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Not authorized, no token' }))];
                }
                return [2 /*return*/];
        }
    });
}); };
exports.protectV2 = protectV2;
