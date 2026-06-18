"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const AuthService_1 = require("../services/AuthService");
const v2_1 = require("../validation/v2");
class AuthController {
    constructor() {
        this.register = async (req, res) => {
            try {
                const parsed = v2_1.registerSchema.parse(req.body);
                const user = await this.authService.register(parsed.email, parsed.password);
                const userOut = {
                    id: user._id?.toString(),
                    email: user.email,
                    role: user.role,
                };
                res.status(201).json({ status: 'success', data: { user: userOut } });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.login = async (req, res) => {
            try {
                const parsed = v2_1.loginSchema.parse(req.body);
                // AuthService now returns { user, accessToken, refreshToken }
                const { user, accessToken, refreshToken } = await this.authService.login(parsed.email, parsed.password);
                const userOut = {
                    id: user._id?.toString(),
                    email: user.email,
                    role: user.role,
                    name: user.name,
                    avatarUrl: user.avatarUrl,
                };
                res.status(200).json({
                    status: 'success',
                    data: { user: userOut, accessToken, refreshToken }
                });
            }
            catch (err) {
                const status = err.message === 'Account is disabled' ? 403 : 401;
                res.status(status).json({ status: 'error', message: err.message });
            }
        };
        this.authService = new AuthService_1.AuthService();
    }
}
exports.AuthController = AuthController;
