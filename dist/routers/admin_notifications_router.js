"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const admin_notifications_controller_1 = require("../controllers/admin_notifications_controller");
const auth_middleware_1 = require("../middlewares/auth_middleware");
const router = express_1.default.Router();
// @route   POST /api/admin/notifications/broadcast
router.post('/broadcast', auth_middleware_1.protect, auth_middleware_1.admin, admin_notifications_controller_1.broadcastNotification);
// @route   GET /api/admin/notifications/history
router.get('/history', auth_middleware_1.protect, auth_middleware_1.admin, admin_notifications_controller_1.getBroadcastHistory);
exports.default = router;
