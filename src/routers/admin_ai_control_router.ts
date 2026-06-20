import { Router } from "express";
import { 
  getProviders,
  createProvider,
  getModels,
  createModel,
  updateModel,
  deleteModel,
  getRoutingRules,
  updateRoutingRule,
  getBenchmarks,
  getCosts,
  getAiLogs,
  getToolMetrics
} from "../controllers/admin_ai_control_controller";
import { authorizeRoles } from "../middlewares/auth_middleware";

const router = Router();

// Ensure only super admin or AI engineers have access to the AI Control Center
router.use(authorizeRoles("admin", "staff"));

// Providers
router.get("/providers", getProviders);
router.post("/providers", createProvider);

// Models
router.get("/models", getModels);
router.post("/models", createModel);
router.put("/models/:id", updateModel);
router.delete("/models/:id", deleteModel);

// Routing
router.get("/routing", getRoutingRules);
router.put("/routing/:id", updateRoutingRule);

// Observability
router.get("/benchmarks", getBenchmarks);
router.get("/costs", getCosts);
router.get("/logs", getAiLogs);
router.get("/metrics", getToolMetrics);

export default router;
