"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashToken = exports.generateRefreshToken = exports.generateAccessToken = void 0;
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var env_1 = require("../config/env");
var crypto_1 = __importDefault(require("crypto"));
var generateAccessToken = function (id, role, tokenVersion) {
    var jwtSecret = env_1.env.JWT_SECRET;
    if (!jwtSecret)
        throw new Error('JWT_SECRET is not configured');
    return jsonwebtoken_1.default.sign({ id: id, sub: id, role: role, tokenVersion: tokenVersion }, jwtSecret, { expiresIn: '15m' });
};
exports.generateAccessToken = generateAccessToken;
var generateRefreshToken = function (id) {
    var refreshSecret = env_1.env.JWT_REFRESH_SECRET;
    if (!refreshSecret)
        throw new Error('JWT_REFRESH_SECRET is not configured');
    var jti = crypto_1.default.randomUUID();
    var token = jsonwebtoken_1.default.sign({ id: id, jti: jti }, refreshSecret, { expiresIn: '30d' });
    return { token: token, jti: jti };
};
exports.generateRefreshToken = generateRefreshToken;
var hashToken = function (token) {
    if (!env_1.env.TOKEN_HASH_SECRET)
        throw new Error('TOKEN_HASH_SECRET is not configured');
    return crypto_1.default.createHmac('sha256', env_1.env.TOKEN_HASH_SECRET).update(token).digest('hex');
};
exports.hashToken = hashToken;
exports.default = exports.generateAccessToken;
