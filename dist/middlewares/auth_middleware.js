"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = exports.authorizeRoles = exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user_model"));
const app_error_1 = require("../utils/app_error");
const protect = async (req, res, next) => {
    console.log("protect called! Auth header:", req.headers.authorization ? 'present' : 'missing');
    if (!req.headers.authorization || !req.headers.authorization.startsWith('Bearer ')) {
        return next(new app_error_1.AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Not authorized, missing or invalid token format' }));
    }
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
        return next(new app_error_1.AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Not authorized, no token provided' }));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        const user = await user_model_1.default.findById(decoded.id).select('-passwordHash');
        if (!user) {
            return next(new app_error_1.AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Not authorized, user not found' }));
        }
        if (user.status === 'disabled') {
            return next(new app_error_1.AppError({ code: 'AUTH_FORBIDDEN', statusCode: 403, message: 'Your account has been disabled' }));
        }
        if (decoded.tokenVersion !== undefined && user.tokenVersion !== decoded.tokenVersion) {
            return next(new app_error_1.AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Session expired, please login again' }));
        }
        req.user = user;
        return next();
    }
    catch (error) {
        console.error("JWT Verification failed:", error);
        return next(new app_error_1.AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Not authorized, token failed' }));
    }
};
exports.protect = protect;
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        const user = req.user;
        console.log("authorizeRoles User:", user ? Object.keys(user) : 'No user', "Role:", user?.role);
        if (!user || !user.role) {
            return next(new app_error_1.AppError({ code: 'AUTH_FORBIDDEN', statusCode: 403, message: 'Access denied: No role assigned' }));
        }
        if (!roles.includes(user.role)) {
            return next(new app_error_1.AppError({ code: 'AUTH_FORBIDDEN', statusCode: 403, message: `Access denied: Requires one of [${roles.join(', ')}]` }));
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
exports.admin = (0, exports.authorizeRoles)('admin', 'super_admin');
