"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var auth_middleware_1 = require("../middlewares/auth_middleware");
var home_tools_controller_1 = require("../controllers/home_tools_controller");
var router = (0, express_1.Router)();
router.get('/analytics', auth_middleware_1.protect, home_tools_controller_1.getHomeToolsAnalytics);
exports.default = router;
