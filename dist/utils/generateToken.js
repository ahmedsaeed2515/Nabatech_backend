"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const crypto_1 = __importDefault(require("crypto"));
const generateAccessToken = (id, role, tokenVersion) => {
    const jwtSecret = env_1.env.JWT_SECRET;
    if (!jwtSecret)
        throw new Error('JWT_SECRET is not configured');
    return jsonwebtoken_1.default.sign({ id, sub: id, role, tokenVersion }, jwtSecret, { expiresIn: '15m' });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (id) => {
    const refreshSecret = env_1.env.JWT_REFRESH_SECRET;
    if (!refreshSecret)
        throw new Error('JWT_REFRESH_SECRET is not configured');
    const jti = crypto_1.default.randomUUID();
    const token = jsonwebtoken_1.default.sign({ id, jti }, refreshSecret, { expiresIn: '30d' });
    return { token, jti };
};
exports.generateRefreshToken = generateRefreshToken;
const hashToken = (token) => {
    if (!env_1.env.TOKEN_HASH_SECRET)
        throw new Error('TOKEN_HASH_SECRET is not configured');
    return crypto_1.default.createHmac('sha256', env_1.env.TOKEN_HASH_SECRET).update(token).digest('hex');
};
exports.hashToken = hashToken;
exports.default = exports.generateAccessToken;
