"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth_middleware");
const home_tools_controller_1 = require("../controllers/home_tools_controller");
const router = (0, express_1.Router)();
router.get('/analytics', auth_middleware_1.protect, home_tools_controller_1.getHomeToolsAnalytics);
exports.default = router;
