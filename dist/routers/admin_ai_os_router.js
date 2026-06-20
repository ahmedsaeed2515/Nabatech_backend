"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_ai_os_controller_1 = require("../controllers/admin_ai_os_controller");
const auth_middleware_1 = require("../middlewares/auth_middleware");
const router = (0, express_1.Router)();
// Ensure only super admin or AI engineers have access to the AI OS Center
router.use(auth_middleware_1.protect, (0, auth_middleware_1.authorizeRoles)("super_admin", "admin", "staff"));
// Agents
router.get("/agents", admin_ai_os_controller_1.getAgentProfiles);
router.put("/agents/:id", admin_ai_os_controller_1.updateAgentProfile);
router.post("/agents", admin_ai_os_controller_1.updateAgentProfile); // Overloading update to handle create
// Policies
router.get("/policies", admin_ai_os_controller_1.getPolicies);
router.put("/policies/:type/:id", admin_ai_os_controller_1.updatePolicy);
router.post("/policies/:type", admin_ai_os_controller_1.updatePolicy); // Overloading update to handle create
// Prompts
router.get("/prompts", admin_ai_os_controller_1.getPrompts);
router.put("/prompts/:id", admin_ai_os_controller_1.updatePrompt);
router.post("/prompts", admin_ai_os_controller_1.updatePrompt);
// Audit
router.get("/audit-logs", admin_ai_os_controller_1.getAuditLogs);
exports.default = router;
