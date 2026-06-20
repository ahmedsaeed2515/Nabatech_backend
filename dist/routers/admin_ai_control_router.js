"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_ai_control_controller_1 = require("../controllers/admin_ai_control_controller");
const auth_middleware_1 = require("../middlewares/auth_middleware");
const router = (0, express_1.Router)();
// Ensure only super admin or AI engineers have access to the AI Control Center
router.use((0, auth_middleware_1.authorizeRoles)("admin", "staff"));
// Providers
router.get("/providers", admin_ai_control_controller_1.getProviders);
router.post("/providers", admin_ai_control_controller_1.createProvider);
// Models
router.get("/models", admin_ai_control_controller_1.getModels);
router.post("/models", admin_ai_control_controller_1.createModel);
router.put("/models/:id", admin_ai_control_controller_1.updateModel);
router.delete("/models/:id", admin_ai_control_controller_1.deleteModel);
// Routing
router.get("/routing", admin_ai_control_controller_1.getRoutingRules);
router.put("/routing/:id", admin_ai_control_controller_1.updateRoutingRule);
// Observability
router.get("/benchmarks", admin_ai_control_controller_1.getBenchmarks);
router.get("/costs", admin_ai_control_controller_1.getCosts);
router.get("/logs", admin_ai_control_controller_1.getAiLogs);
router.get("/metrics", admin_ai_control_controller_1.getToolMetrics);
exports.default = router;
