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
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const jwtSecret = process.env.JWT_SECRET;
            if (!jwtSecret) {
                throw new Error('JWT_SECRET is not configured');
            }
            const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
            const user = await user_model_1.default.findById(decoded.id).select('-password');
            if (!user) {
                return next(new app_error_1.AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Not authorized, user not found' }));
            }
            if (user.status === 'disabled') {
                return next(new app_error_1.AppError({ code: 'AUTH_ACCOUNT_DISABLED', statusCode: 401, message: 'Account disabled' }));
            }
            if (user.tokenVersion !== decoded.tokenVersion) {
                return next(new app_error_1.AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Token invalid or revoked' }));
            }
            req.user = user;
            return next();
        }
        catch (error) {
            return next(new app_error_1.AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Not authorized, token failed' }));
        }
    }
    if (!token) {
        return next(new app_error_1.AppError({ code: 'AUTH_REQUIRED', statusCode: 401, message: 'Not authorized, no token' }));
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
