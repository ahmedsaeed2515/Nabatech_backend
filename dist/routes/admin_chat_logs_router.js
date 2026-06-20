"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_chat_logs_controller_1 = require("../controllers/admin_chat_logs_controller");
const auth_middleware_1 = require("../middlewares/auth_middleware");
const router = (0, express_1.Router)();
// Protect all routes
router.use(auth_middleware_1.protect, (0, auth_middleware_1.authorizeRoles)("super_admin", "admin", "staff"));
router.get("/analytics", admin_chat_logs_controller_1.getChatAnalytics);
router.get("/sessions", admin_chat_logs_controller_1.getChatSessions);
router.get("/tool-calls", admin_chat_logs_controller_1.getChatToolCalls);
router.get("/diagnoses", admin_chat_logs_controller_1.getChatDiagnoses);
router.get("/:id", admin_chat_logs_controller_1.getChatLogById);
router.get("/", admin_chat_logs_controller_1.getChatLogs);
exports.default = router;
