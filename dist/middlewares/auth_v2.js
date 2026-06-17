"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protectV2 = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user_model"));
const protectV2 = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const secret = process.env.JWT_SECRET || 'fallback_secret';
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            // decoded should have userId from V2 AuthService
            const user = await user_model_1.default.findById(decoded.userId).select('-passwordHash');
            if (!user) {
                return res.status(401).json({ status: 'error', message: 'Not authorized, user not found' });
            }
            req.user = user;
            return next();
        }
        catch (err) {
            return res.status(401).json({ status: 'error', message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        return res.status(401).json({ status: 'error', message: 'Not authorized, no token' });
    }
};
exports.protectV2 = protectV2;
