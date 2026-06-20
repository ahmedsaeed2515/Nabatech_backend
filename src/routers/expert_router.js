"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var expert_controller_1 = require("../controllers/expert_controller");
var auth_middleware_1 = require("../middlewares/auth_middleware");
var router = (0, express_1.Router)();
// Admin / Expert Escalation Routes
router.get('/admin/escalations/stream', auth_middleware_1.protect, (0, auth_middleware_1.authorizeRoles)('admin', 'expert', 'staff'), expert_controller_1.streamEscalations);
router.get('/admin/escalations', auth_middleware_1.protect, (0, auth_middleware_1.authorizeRoles)('admin', 'expert', 'staff'), expert_controller_1.getEscalations);
router.post('/admin/escalations/:id/claim', auth_middleware_1.protect, (0, auth_middleware_1.authorizeRoles)('admin', 'expert', 'staff'), expert_controller_1.claimEscalation);
router.post('/admin/escalations/:id/resolve', auth_middleware_1.protect, (0, auth_middleware_1.authorizeRoles)('admin', 'expert', 'staff'), expert_controller_1.resolveEscalation);
// Profile viewing is accessible to any authenticated user
router.get('/:id', auth_middleware_1.protect, expert_controller_1.getExpertProfile);
// Profile updating is restricted to experts only
router.put('/me/profile', auth_middleware_1.protect, (0, auth_middleware_1.authorizeRoles)('expert'), expert_controller_1.updateMyExpertProfile);
exports.default = router;
