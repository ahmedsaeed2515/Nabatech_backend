"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const UserRepository_1 = require("../repositories/UserRepository");
const generateToken_1 = require("../utils/generateToken");
/**
 * AuthService (V2)
 * ─────────────────
 * This service is used by the V2 AuthController (routers/v2/index.ts).
 * It issues tokens compatible with the shared auth middleware (protect / protectV2).
 * Token payload must match generateAccessToken: { id, sub, role, tokenVersion }
 */
class AuthService {
    constructor() {
        this.userRepository = new UserRepository_1.UserRepository();
    }
    async register(email, password) {
        const existing = await this.userRepository.findByEmail(email);
        if (existing) {
            throw new Error('Email already in use');
        }
        const hashed = await bcryptjs_1.default.hash(password, 10);
        return this.userRepository.create({ email, passwordHash: hashed });
    }
    async login(email, password) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }
        // Account status gate
        if (user.status === 'disabled') {
            throw new Error('Account is disabled');
        }
        const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }
        // Issue tokens using the shared utility so payloads are consistent across V1 and V2
        const accessToken = (0, generateToken_1.generateAccessToken)(user._id.toString(), user.role || 'user', user.tokenVersion ?? 0);
        const { token: refreshToken } = (0, generateToken_1.generateRefreshToken)(user._id.toString());
        return { user, accessToken, refreshToken };
    }
}
exports.AuthService = AuthService;
