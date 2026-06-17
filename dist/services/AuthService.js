"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UserRepository_1 = require("../repositories/UserRepository");
class AuthService {
    constructor() {
        this.userRepository = new UserRepository_1.UserRepository();
    }
    async register(email, passwordHash) {
        const existing = await this.userRepository.findByEmail(email);
        if (existing) {
            throw new Error('Email already in use');
        }
        // Usually passwordHash comes raw from client, we hash it
        const hashed = await bcryptjs_1.default.hash(passwordHash, 10);
        return this.userRepository.create({ email, passwordHash: hashed });
    }
    async login(email, passwordHash) {
        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }
        const isValid = await bcryptjs_1.default.compare(passwordHash, user.passwordHash);
        if (!isValid) {
            throw new Error('Invalid credentials');
        }
        const secret = process.env.JWT_SECRET || 'fallback_secret';
        const token = jsonwebtoken_1.default.sign({ userId: user._id, role: user.role }, secret, { expiresIn: '7d' });
        return { user, token };
    }
}
exports.AuthService = AuthService;
