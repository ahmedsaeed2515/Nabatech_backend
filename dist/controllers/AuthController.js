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
                res.status(201).json({ status: 'success', data: user });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.login = async (req, res) => {
            try {
                const parsed = v2_1.loginSchema.parse(req.body);
                const { user, token } = await this.authService.login(parsed.email, parsed.password);
                res.status(200).json({ status: 'success', data: { user, token } });
            }
            catch (err) {
                res.status(401).json({ status: 'error', message: err.message });
            }
        };
        this.authService = new AuthService_1.AuthService();
    }
}
exports.AuthController = AuthController;
