"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectV2 = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user_model"));
const app_error_1 = require("../utils/app_error");
const env_1 = require("../config/env");
/**
 * protectV2
 * ─────────
 * Validates the Bearer access token issued by generateAccessToken().
 * Performs the same three security gates as the V1 `protect` middleware:
 *   1. Signature verification against JWT_SECRET
 *   2. Account-disabled check  (status === 'disabled')
 *   3. Token-version check     (prevents stale tokens after password reset / logout-all)
 */
const protectV2 = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            // ── 1. Verify signature ─────────────────────────────────────────────
            const jwtSecret = env_1.env.JWT_SECRET;
            if (!jwtSecret) {
                return next(new app_error_1.AppError({ code: 'SERVER_ERROR', statusCode: 500, message: 'JWT_SECRET is not configured' }));
            }
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            // Access tokens from generateAccessToken() carry { id, sub, role, tokenVersion }
            const user = await user_model_1.default.findById(decoded.id).select('-passwordHash');
            if (!user) {
                return next(new app_error_1.AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Not authorized, user not found' }));
            }
            // ── 2. Account status gate ─────────────────────────────────────────
            if (user.status === 'disabled') {
                return next(new app_error_1.AppError({ code: 'AUTH_ACCOUNT_DISABLED', statusCode: 401, message: 'Account disabled' }));
            }
            // ── 3. Token-version gate (invalidates tokens after password reset / logout-all) ─
            if (user.tokenVersion !== decoded.tokenVersion) {
                return next(new app_error_1.AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Token invalid or revoked' }));
            }
            req.user = user;
            return next();
        }
        catch (err) {
            return next(new app_error_1.AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Not authorized, token failed' }));
        }
    }
    if (!token) {
        return next(new app_error_1.AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Not authorized, no token' }));
    }
};
exports.protectV2 = protectV2;
