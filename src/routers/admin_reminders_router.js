"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var reminders_controller_1 = require("../controllers/reminders_controller");
var auth_middleware_1 = require("../middlewares/auth_middleware");
var router = (0, express_1.Router)();
router.get("/", auth_middleware_1.protect, auth_middleware_1.admin, reminders_controller_1.getAdminReminders);
router.get("/stats", auth_middleware_1.protect, auth_middleware_1.admin, reminders_controller_1.getAdminStats);
exports.default = router;
