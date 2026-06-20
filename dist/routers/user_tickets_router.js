"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_tickets_controller_1 = require("../controllers/user_tickets_controller");
const auth_middleware_1 = require("../middlewares/auth_middleware");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user_model"));
const router = (0, express_1.Router)();
// Middleware to optionally populate req.user if a valid token is provided
const optionalProtect = async (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const jwtSecret = process.env.JWT_SECRET;
            if (jwtSecret) {
                const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
                const user = await user_model_1.default.findById(decoded.id).select('-password');
                if (user && user.status !== 'disabled' && user.tokenVersion === decoded.tokenVersion) {
                    req.user = user;
                }
            }
        }
        catch (error) {
            // Fail silently and proceed as guest
        }
    }
    next();
};
router.post("/", optionalProtect, user_tickets_controller_1.createTicket);
router.get("/", auth_middleware_1.protect, user_tickets_controller_1.getUserTickets);
router.get("/:id", auth_middleware_1.protect, user_tickets_controller_1.getUserTicketById);
router.post("/:id/reply", auth_middleware_1.protect, user_tickets_controller_1.replyToOwnTicket);
exports.default = router;
