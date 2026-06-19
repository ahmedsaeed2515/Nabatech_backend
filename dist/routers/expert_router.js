"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const expert_controller_1 = require("../controllers/expert_controller");
const auth_middleware_1 = require("../middlewares/auth_middleware");
const router = (0, express_1.Router)();
// Profile viewing is accessible to any authenticated user
router.get('/:id', auth_middleware_1.protect, expert_controller_1.getExpertProfile);
// Profile updating is restricted to experts only
router.put('/me/profile', auth_middleware_1.protect, (0, auth_middleware_1.authorizeRoles)('expert'), expert_controller_1.updateMyExpertProfile);
exports.default = router;
